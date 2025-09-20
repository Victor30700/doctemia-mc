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
  BookMarked, Sun, ArrowRight, PlayCircle, BrainCircuit, Stethoscope, Target, Zap, Award, MapPin,  
} from 'lucide-react';
import { Linkedin } from 'lucide-react';

// Paleta de colores personalizada
const CUSTOM_COLORS = {
  primary: '#73C7E3',    // Celeste principal
  background: '#FFF9F0', // Fondo crema
  secondary: '#24B0BA',  // Verde azulado
  neutral: '#F0F2F2',    // Gris claro
  dark: '#2E4A70',       // Azul oscuro
  gold: '#CF8A40',       // Dorado para tarjetas
};

// --- COMPONENTE MEJORADO: Fondo Animado con Paleta Personalizada ---
function AnimatedBackground({ isDark, scrollY }) {
  // Calculamos el progreso del scroll (0 a 1) con validaciones
  const getScrollProgress = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return 0;
    
    const scrollHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const maxScroll = scrollHeight - windowHeight;
    
    if (!maxScroll || maxScroll <= 0 || !scrollY || scrollY < 0) return 0;
    if (!isFinite(scrollY) || !isFinite(maxScroll)) return 0;
    
    return Math.min(Math.max(scrollY / maxScroll, 0), 1);
  };

  const scrollProgress = getScrollProgress();
  
  // Definimos las tonalidades que cambian con el scroll usando la paleta personalizada
  const getBackgroundStyle = () => {
    const progress = isFinite(scrollProgress) ? scrollProgress : 0;
    
    if (isDark) {
      // Modo oscuro: transiciones usando colores personalizados
      if (progress < 0.25) {
        const factor = Math.max(0, Math.min(progress, 0.25));
        return {
          background: `linear-gradient(135deg, 
            rgba(46, 74, 112, ${Math.max(0.1, 0.9 - factor * 2)}) 0%, 
            rgba(36, 176, 186, ${Math.max(0.1, 0.3 - factor * 0.5)}) 25%, 
            rgba(115, 199, 227, ${Math.max(0.1, 0.2 - factor * 0.3)}) 50%, 
            rgba(46, 74, 112, ${Math.max(0.1, 0.6 - factor * 0.5)}) 75%, 
            rgba(46, 74, 112, ${Math.max(0.1, 0.9 - factor * 2)}) 100%)`
        };
      } else if (progress < 0.5) {
        const factor = Math.max(0, Math.min(progress - 0.25, 0.25));
        return {
          background: `linear-gradient(135deg, 
            rgba(46, 74, 112, 0.8) 0%, 
            rgba(36, 176, 186, ${Math.max(0.1, Math.min(0.9, 0.4 + factor * 0.4))}) 25%, 
            rgba(115, 199, 227, ${Math.max(0.1, Math.min(0.9, 0.3 + factor * 0.6))}) 50%, 
            rgba(207, 138, 64, ${Math.max(0.1, Math.min(0.9, 0.2 + factor * 0.4))}) 75%, 
            rgba(46, 74, 112, 0.8) 100%)`
        };
      } else if (progress < 0.75) {
        const factor = Math.max(0, Math.min(progress - 0.5, 0.25));
        return {
          background: `linear-gradient(135deg, 
            rgba(36, 176, 186, 0.8) 0%, 
            rgba(115, 199, 227, ${Math.max(0.1, Math.min(0.9, 0.6 + factor * 0.4))}) 25%, 
            rgba(207, 138, 64, ${Math.max(0.1, Math.min(0.9, 0.4 + factor * 0.6))}) 50%, 
            rgba(46, 74, 112, ${Math.max(0.1, Math.min(0.9, 0.5 + factor * 0.4))}) 75%, 
            rgba(36, 176, 186, 0.8) 100%)`
        };
      } else {
        const factor = Math.max(0, Math.min(progress - 0.75, 0.25));
        return {
          background: `linear-gradient(135deg, 
            rgba(115, 199, 227, 0.9) 0%, 
            rgba(207, 138, 64, ${Math.max(0.1, Math.min(0.9, 0.7 + factor * 0.3))}) 25%, 
            rgba(36, 176, 186, ${Math.max(0.1, Math.min(0.9, 0.5 + factor * 0.5))}) 50%, 
            rgba(46, 74, 112, ${Math.max(0.1, Math.min(0.9, 0.6 + factor * 0.4))}) 75%, 
            rgba(115, 199, 227, 0.9) 100%)`
        };
      }
    } else {
      // Modo claro: fondo base crema con transiciones suaves
      const baseColor = 'rgba(255, 249, 240, 0.95)'; // FFF9F0
      if (progress < 0.25) {
        const factor = Math.max(0, Math.min(progress, 0.25));
        return {
          background: `linear-gradient(135deg, 
            ${baseColor} 0%, 
            rgba(240, 242, 242, ${Math.max(0.8, 0.9 - factor * 0.1)}) 25%, 
            rgba(115, 199, 227, ${Math.max(0.1, factor * 0.2)}) 50%, 
            rgba(240, 242, 242, ${Math.max(0.8, 0.9 - factor * 0.1)}) 75%, 
            ${baseColor} 100%)`
        };
      } else if (progress < 0.5) {
        const factor = Math.max(0, Math.min(progress - 0.25, 0.25));
        return {
          background: `linear-gradient(135deg, 
            ${baseColor} 0%, 
            rgba(115, 199, 227, ${Math.max(0.1, Math.min(0.3, 0.2 + factor * 0.2))}) 25%, 
            rgba(36, 176, 186, ${Math.max(0.05, Math.min(0.2, factor * 0.3))}) 50%, 
            rgba(115, 199, 227, ${Math.max(0.1, Math.min(0.3, 0.2 + factor * 0.2))}) 75%, 
            ${baseColor} 100%)`
        };
      } else if (progress < 0.75) {
        const factor = Math.max(0, Math.min(progress - 0.5, 0.25));
        return {
          background: `linear-gradient(135deg, 
            ${baseColor} 0%, 
            rgba(36, 176, 186, ${Math.max(0.1, Math.min(0.4, 0.2 + factor * 0.3))}) 25%, 
            rgba(207, 138, 64, ${Math.max(0.05, Math.min(0.2, factor * 0.3))}) 50%, 
            rgba(36, 176, 186, ${Math.max(0.1, Math.min(0.4, 0.2 + factor * 0.3))}) 75%, 
            ${baseColor} 100%)`
        };
      } else {
        const factor = Math.max(0, Math.min(progress - 0.75, 0.25));
        return {
          background: `linear-gradient(135deg, 
            ${baseColor} 0%, 
            rgba(207, 138, 64, ${Math.max(0.1, Math.min(0.3, 0.15 + factor * 0.3))}) 25%, 
            rgba(46, 74, 112, ${Math.max(0.05, Math.min(0.2, factor * 0.25))}) 50%, 
            rgba(207, 138, 64, ${Math.max(0.1, Math.min(0.3, 0.15 + factor * 0.3))}) 75%, 
            ${baseColor} 100%)`
        };
      }
    }
  };

  // Colores de líneas usando la paleta personalizada
  const getLineColor = () => {
    const progress = isFinite(scrollProgress) ? scrollProgress : 0;
    if (isDark) {
      const baseOpacity = Math.max(0.02, Math.min(0.2, 0.08 + progress * 0.12));
      return `rgba(115, 199, 227, ${baseOpacity})`; // Color primario
    } else {
      const baseOpacity = Math.max(0.02, Math.min(0.16, 0.06 + progress * 0.1));
      return `rgba(36, 176, 186, ${baseOpacity})`; // Color secundario
    }
  };

  // Colores de orbes usando la paleta personalizada
  const getOrbColors = () => {
    const progress = isFinite(scrollProgress) ? scrollProgress : 0;
    if (isDark) {
      return {
        orb1: `rgba(115, 199, 227, ${Math.max(0.05, Math.min(0.3, 0.15 + progress * 0.15))})`, // Primary
        orb2: `rgba(207, 138, 64, ${Math.max(0.04, Math.min(0.3, 0.12 + progress * 0.18))})`, // Gold
        orb3: `rgba(36, 176, 186, ${Math.max(0.03, Math.min(0.3, 0.1 + progress * 0.2))})`  // Secondary
      };
    } else {
      return {
        orb1: `rgba(115, 199, 227, ${Math.max(0.03, Math.min(0.2, 0.1 + progress * 0.1))})`, // Primary
        orb2: `rgba(207, 138, 64, ${Math.max(0.02, Math.min(0.2, 0.08 + progress * 0.12))})`, // Gold
        orb3: `rgba(36, 176, 186, ${Math.max(0.02, Math.min(0.2, 0.06 + progress * 0.14))})`  // Secondary
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
      
      {/* Orbes flotantes con colores personalizados */}
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
              background: `radial-gradient(circle, rgba(46, 74, 112, ${isDark ? '0.15' : '0.1'}) 0%, transparent 70%)`,
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
              background: `radial-gradient(circle, rgba(207, 138, 64, ${isDark ? '0.12' : '0.08'}) 0%, transparent 70%)`,
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

// --- COMPONENTE MEJORADO: Tarjeta de Equipo con colores personalizados ---
function TeamMemberCard({ name, role, imageSrc, description, Icon, isDark }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const cardBaseStyle = 'w-full h-96 rounded-2xl shadow-lg transition-all duration-700 [transform-style:preserve-3d] cursor-pointer group';
  const cardFaceStyle = 'absolute w-full h-full [backface-visibility:hidden] rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 text-center';
  
  // Usando colores personalizados para las tarjetas
  const cardFrontBg = isDark 
    ? 'bg-gray-900/90 backdrop-blur-md border-gray-700/50' 
    : 'bg-white/90 backdrop-blur-md border-gray-200/50';
  const cardBackBg = isDark 
    ? 'bg-gray-800/95 backdrop-blur-md border-gray-700/50' 
    : 'bg-gray-100/95 backdrop-blur-md border-gray-200/50';

  return (
    <div 
      className="w-full max-w-sm mx-auto [perspective:1000px] transform transition-all duration-300 hover:scale-105" 
      onClick={() => setIsFlipped(!isFlipped)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`${cardBaseStyle} ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
        style={{
          transform: isHovered && !isFlipped ? 'rotateX(5deg) rotateY(-5deg)' : '',
          boxShadow: isHovered ? `0 25px 50px -12px rgba(115, 199, 227, 0.3)` : '',
        }}
      >
        {/* Cara Frontal */}
        <div className={`${cardFaceStyle} ${cardFrontBg} border-2`} 
             style={{borderColor: isHovered ? CUSTOM_COLORS.primary : (isDark ? '#374151' : '#e5e7eb')}}>
          <div 
            className={`w-32 h-32 rounded-full overflow-hidden border-4 mb-4 transition-all duration-500 ${isHovered ? 'scale-110' : ''}`}
            style={{
              borderColor: CUSTOM_COLORS.primary,
              boxShadow: isHovered ? `0 10px 25px rgba(115, 199, 227, 0.4)` : ''
            }}
          >
            <Image
              src={imageSrc}
              alt={`Foto de ${name}`}
              width={128}
              height={128}
              className="object-cover w-full h-full transition-transform duration-500 hover:scale-110"
              onError={(e) => { e.currentTarget.src = `https://placehold.co/128x128/${isDark ? '374151/9ca3af' : 'e5e7eb/4b5563'}?text=${name.charAt(0)}`; }}
            />
          </div>
          <h3 className={`text-2xl font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {name}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            {Icon && <Icon className={`w-5 h-5 transition-all duration-300 ${isHovered ? 'scale-110' : ''}`} 
                          style={{color: CUSTOM_COLORS.primary}} />}
            <p className={`text-md font-semibold`} style={{color: CUSTOM_COLORS.primary}}>{role}</p>
          </div>
          <div 
            className={`mt-4 px-3 py-1 rounded-full text-sm transition-all duration-300 ${isHovered ? 'scale-105' : ''}`}
            style={{
              backgroundColor: `${CUSTOM_COLORS.primary}20`,
              color: CUSTOM_COLORS.primary,
              backgroundColor: isHovered ? `${CUSTOM_COLORS.primary}30` : `${CUSTOM_COLORS.primary}20`
            }}
          >
            Toca para saber más
          </div>
        </div>

        {/* Cara Trasera */}
        <div className={`${cardFaceStyle} ${cardBackBg} [transform:rotateY(180deg)] justify-center p-8 border-2`}
             style={{borderColor: isDark ? '#374151' : '#e5e7eb'}}>
          <h4 className={`text-xl font-semibold mb-4`} style={{color: CUSTOM_COLORS.primary}}>
            Sobre {name.split(' ')[0]}
          </h4>
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

// --- Componente para Tarjeta de Acceso con colores personalizados ---
function AccessCard({ href, title, description, Icon, isDark }) {
  const [isHovered, setIsHovered] = useState(false);
  const cardBg = isDark ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50';

  return (
    <Link
      href={href}
      className={`block border-2 ${cardBg} p-6 rounded-2xl shadow-lg backdrop-blur-lg transition-all duration-500 transform hover:-translate-y-3 hover:shadow-2xl group relative overflow-hidden`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        borderColor: isHovered ? CUSTOM_COLORS.primary : (isDark ? '#374151' : '#e5e7eb'),
        boxShadow: isHovered ? `0 25px 50px -12px rgba(115, 199, 227, 0.25)` : ''
      }}
    >
      <div className="flex items-center mb-4 relative z-10">
        {Icon && (
          <div 
            className={`p-2 rounded-lg mr-3 transition-all duration-300 ${isHovered ? 'scale-110' : ''}`}
            style={{
              backgroundColor: isHovered ? `${CUSTOM_COLORS.primary}30` : `${CUSTOM_COLORS.primary}20`
            }}
          >
            <Icon className={`w-6 h-6 transition-all duration-300 ${isHovered ? 'scale-110' : ''}`} 
                  style={{color: CUSTOM_COLORS.secondary}} />
          </div>
        )}
        <h2 className={`text-xl font-semibold transition-all duration-300 ${isHovered ? 'scale-105' : ''}`}
            style={{color: CUSTOM_COLORS.dark}}>
          {title}
        </h2>
      </div>
      <p className={`text-sm leading-relaxed transition-all duration-300 relative z-10 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
        {description}
      </p>
      
      {/* Efecto de brillo en hover */}
      <div 
        className={`absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 ${isHovered ? 'opacity-100' : ''}`}
        style={{
          background: `linear-gradient(135deg, ${CUSTOM_COLORS.primary}05 0%, ${CUSTOM_COLORS.secondary}08 50%, ${CUSTOM_COLORS.primary}05 100%)`
        }}
      />
    </Link>
  );
}

// --- Componente para Tarjeta de Características DORADAS ---
function FeatureCard({ Icon, title, description, isDark }) {
    const [isHovered, setIsHovered] = useState(false);
    const cardBg = isDark ? 'bg-gray-900/90 backdrop-blur-md' : 'bg-white/90 backdrop-blur-md';

    return (
        <div 
          className={`border-2 rounded-2xl p-8 text-center flex flex-col items-center ${cardBg} transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 group relative overflow-hidden`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            borderColor: isHovered ? CUSTOM_COLORS.gold : (isDark ? '#374151' : '#e5e7eb'),
            boxShadow: isHovered ? `0 25px 50px -12px rgba(207, 138, 64, 0.3)` : '',
            background: isHovered 
              ? (isDark ? `linear-gradient(135deg, rgba(207, 138, 64, 0.1) 0%, rgba(46, 74, 112, 0.05) 100%)` 
                        : `linear-gradient(135deg, rgba(207, 138, 64, 0.08) 0%, rgba(255, 249, 240, 0.95) 100%)`)
              : cardBg
          }}
        >
            {/* Efecto de ondas en hover */}
            <div 
              className={`absolute inset-0 opacity-0 transition-opacity duration-700 ${isHovered ? 'opacity-100' : ''}`}
              style={{
                background: `radial-gradient(circle at center, ${CUSTOM_COLORS.gold}15 0%, transparent 70%)`
              }}
            />
            
            <div 
              className={`mb-6 p-4 rounded-full transition-all duration-500 ${isHovered ? 'scale-110' : ''} relative z-10`}
              style={{
                backgroundColor: isHovered ? `${CUSTOM_COLORS.gold}30` : `${CUSTOM_COLORS.gold}20`,
                boxShadow: isHovered ? `0 10px 25px rgba(207, 138, 64, 0.4)` : ''
              }}
            >
                <Icon className={`w-10 h-10 transition-all duration-500 ${isHovered ? 'scale-110' : ''}`} 
                      style={{color: CUSTOM_COLORS.gold}} />
            </div>
            <h3 className={`text-2xl font-bold mb-3 transition-all duration-300 ${isHovered ? 'scale-105' : ''} relative z-10 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h3>
            <p className={`leading-relaxed transition-all duration-300 relative z-10 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {description}
            </p>
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
          setLocation({
            latitude: -17.39,
            longitude: -66.16,
            city: 'Cochabamba'
          });
        }
      );
    } else {
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
      if (isFinite(scrollPosition) && scrollPosition >= 0) {
        setScrollY(scrollPosition);
      }
    };

    window.addEventListener('scroll', handleScroll);
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
      <section className="min-h-screen flex items-center justify-center" style={{backgroundColor: CUSTOM_COLORS.background}}>
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 animate-spin" style={{color: CUSTOM_COLORS.primary}} />
          <p style={{color: CUSTOM_COLORS.dark}}>Cargando experiencia...</p>
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
                        <span style={{color: CUSTOM_COLORS.gold}} className="animate-pulse">{weatherDetails.icon}</span>
                        <span>{Math.round(weatherData.current.temperature_2m)}°C</span>
                      </div>
                      <div className="w-px h-4 bg-gray-500 hidden sm:block"></div>
                    </>
                  )}
                  <div className="flex items-center gap-2 transition-all duration-300 hover:scale-105">
                    <MapPin size={16} style={{color: CUSTOM_COLORS.primary}}/>
                    <span style={{color: CUSTOM_COLORS.primary}}>{location.city}</span>
                  </div>
                  <div className="w-px h-4 bg-gray-500 hidden sm:block"></div>
                  <div className="flex items-center gap-2 transition-all duration-300 hover:scale-105">
                    <Clock size={16} style={{color: CUSTOM_COLORS.secondary}}/>
                    <span style={{color: CUSTOM_COLORS.secondary}}>{currentTime}</span>
                  </div>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-tight mb-4 text-shadow-lg animate-slide-up-delay-1">
                BIENVENIDO A DOCTEMIA MC <br/> 
                <span 
                  className="bg-clip-text text-transparent animate-gradient"
                  style={{
                    backgroundImage: `linear-gradient(45deg, ${CUSTOM_COLORS.primary}, ${CUSTOM_COLORS.secondary}, ${CUSTOM_COLORS.gold})`,
                    backgroundSize: '200% 200%'
                  }}
                >
                  Aprendizaje Médico
                </span>.
              </h1>
              <p className="text-lg md:text-xl max-w-2xl mx-auto text-gray-300 mb-8 animate-slide-up-delay-2">
                Hola, <span 
                  className="font-semibold text-white px-2 py-1 rounded-md" 
                  style={{backgroundColor: `${CUSTOM_COLORS.primary}40`}}
                >
                  {user?.fullName || user?.email || 'Usuario'}
                </span>. listo para prepararte...
              </p>
              <a 
                href="#introduccion" 
                className="inline-flex items-center justify-center px-8 py-3 rounded-full text-lg font-semibold transition-all duration-500 transform hover:scale-110 shadow-lg animate-slide-up-delay-3 group"
                style={{
                  background: `linear-gradient(45deg, ${CUSTOM_COLORS.primary}, ${CUSTOM_COLORS.secondary})`,
                  boxShadow: `0 10px 25px rgba(115, 199, 227, 0.3)`
                }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = `0 15px 35px rgba(115, 199, 227, 0.5)`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = `0 10px 25px rgba(115, 199, 227, 0.3)`;
                }}
              >
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
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter animate-fade-in-up">
                Tu vocación. Necesita una buena prepararación.
              </h2>
              <p className={`mt-4 text-lg md:text-xl ${secondaryTextColor} max-w-3xl mx-auto animate-fade-in-up-delay`}>
                Clases claras. Casos reales. Simulacros tipo examen.
                Hecho por médicos jóvenes, para quienes se preparan con vocación.
                Estudia lo que cae. Aprende lo que importa.
                Desde donde quieras, cuando quieras.
              </p>
          </div>
        </section>

        {/* --- SECCIÓN 3: NUESTRA METODOLOGÍA CON TARJETAS DORADAS --- */}
        <section id="metodologia" className="py-24 md:py-32 bg-transparent">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tighter animate-fade-in-up">
                    Una Metodología Diseñada para Ti
                  </h2>
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
      <h2 className="text-4xl md:text-5xl font-bold tracking-tighter animate-fade-in-up">
        Guiado por Expertos
      </h2>
      <p className={`mt-4 text-lg md:text-xl max-w-3xl mx-auto ${secondaryTextColor} animate-fade-in-up-delay`}>
        Profesionales apasionados y dedicados a potenciar tu carrera médica.
      </p>
    </div>

    {/* Contenedor de la grilla principal para todas las tarjetas */}
    <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
      
      {/* Tarjeta de los médicos */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <TeamMemberCard
          name="Maria Jose Loaiza Marquez."
          role="Medico"
          imageSrc="/images/majo.png"
          description="Médico especialista y educadora por vocación. Transforma temas médicos complejos en lecciones claras y memorables, preparándote para los desafíos del mundo real."
          Icon={Stethoscope}
          isDark={isDark}
        />
      </div>
      <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <TeamMemberCard
          name="Pablo Aparicio Verdun"
          role="Medico"
          imageSrc="/images/chompi.png"
          description="Médico con formación en educación superior. Combino la práctica clínica con la docencia, ayudando a estudiantes a prepararse para el examen de grado con enfoque en criterio, claridad y confianza."
          Icon={Stethoscope}
          isDark={isDark}
        />
      </div>
      <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <TeamMemberCard
          name="Carolina Paz Rojas"
          role="Medico"
          imageSrc="/images/ciru.png"
          description="Médico cirujano con experiencia clínica y vocación docente. Me dedico a la formación de pregrado y preparación para el Examen de Grado, con un enfoque claro, estructurado y centrado en el razonamiento clínico."
          Icon={Stethoscope}
          isDark={isDark}
        />
      </div>

      {/* Tarjeta de Creadores y Desarrolladores, ahora centrada en la grilla */}
      {/* Las clases `col-span-1 md:col-span-2 lg:col-span-3` hacen que ocupe todo el ancho de la grilla en diferentes tamaños de pantalla */}
      <div className="animate-fade-in-up col-span-1 md:col-span-2 lg:col-span-3 flex justify-center" style={{ animationDelay: '0.1s' }}>
        <div 
          className={`w-full max-w-2xl rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 ${isDark ? 'bg-gray-900/90 backdrop-blur-md border border-gray-700/50' : 'bg-white/90 backdrop-blur-md border border-gray-200/50'}`}
        >
          <div className="p-6 flex flex-col md:flex-row items-center justify-center text-center md:text-left">
            <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-6">
              <div 
                className="w-32 h-32 rounded-full overflow-hidden border-4 border-dashed" 
                style={{ borderColor: CUSTOM_COLORS.primary }}
              >
                <Image
                  src="/images/logo.jpg"
                  alt="Logo del equipo de desarrollo"
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
            <div className="flex-grow">
              <div className="flex flex-col items-center md:items-start">
                <h3 className={`text-2xl font-bold tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Creadores y Desarrolladores
                </h3>
                <p className={`mt-2 text-base font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  La plataforma fue creada por Victor Hugo Saldaña Ortiz y Daniel Mancilla Tejerina, desarrolladores Full-Stack responsables de diseñar e implementar una experiencia de aprendizaje en línea intuitiva, eficiente y de alto nivel tecnológico.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4">
                <Link href="https://www.linkedin.com/in/victor-hugo-saldana-ortiz-372a35271" target="_blank" rel="noopener noreferrer" className="group">
                  <div 
                    className={`flex items-center gap-2 text-sm font-semibold p-2 rounded-full transition-all duration-300 hover:scale-105`}
                    style={{ backgroundColor: `${CUSTOM_COLORS.primary}20`, color: CUSTOM_COLORS.primary }}
                  >
                    <Linkedin className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
                    <span>Victor Hugo Saldaña Ortiz</span>
                  </div>
                </Link>
                <Link href="http://www.linkedin.com/in/daniel-mancilla-tejerina-126b07307" target="_blank" rel="noopener noreferrer" className="group">
                  <div 
                    className={`flex items-center gap-2 text-sm font-semibold p-2 rounded-full transition-all duration-300 hover:scale-105`}
                    style={{ backgroundColor: `${CUSTOM_COLORS.primary}20`, color: CUSTOM_COLORS.primary }}
                  >
                    <Linkedin className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
                    <span>Daniel Mancilla Tejerina</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

        {/* --- SECCIÓN 5: ACCESOS RÁPIDOS --- */}
        <section id="explora" className="py-24 md:py-32 relative overflow-hidden bg-transparent">
          <div className="absolute inset-0 z-0">
              <div 
                className="absolute w-96 h-96 rounded-full -top-32 -left-32 blur-3xl animate-pulse"
                style={{backgroundColor: `${CUSTOM_COLORS.primary}20`}}
              ></div>
              <div 
                className="absolute w-96 h-96 rounded-full -bottom-32 -right-32 blur-3xl animate-pulse" 
                style={{
                  backgroundColor: `${CUSTOM_COLORS.gold}20`,
                  animationDelay: '2s'
                }}
              ></div>
          </div>
          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter animate-fade-in-up">
                Tu Centro de Mando
              </h2>
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

      {/* Estilos CSS personalizados para animaciones con colores personalizados */}
      <style jsx global>{`
        :root {
          --custom-primary: ${CUSTOM_COLORS.primary};
          --custom-background: ${CUSTOM_COLORS.background};
          --custom-secondary: ${CUSTOM_COLORS.secondary};
          --custom-neutral: ${CUSTOM_COLORS.neutral};
          --custom-dark: ${CUSTOM_COLORS.dark};
          --custom-gold: ${CUSTOM_COLORS.gold};
        }

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
          0%, 100% { 
            background-position: 0% 50%; 
          }
          50% { 
            background-position: 100% 50%; 
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: calc(200px + 100%) 0;
          }
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

        .animate-shimmer {
          background: linear-gradient(
            90deg,
            var(--custom-gold) 0%,
            var(--custom-primary) 50%,
            var(--custom-gold) 100%
          );
          background-size: 200px 100%;
          animation: shimmer 2s infinite;
        }

        .text-shadow-lg {
          text-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        /* Scroll suave */
        html {
          scroll-behavior: smooth;
        }

        /* Personalización del scrollbar con colores personalizados */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(240, 242, 242, 0.3);
        }

        ::-webkit-scrollbar-thumb {
          background: var(--custom-primary);
          border-radius: 4px;
          opacity: 0.5;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: var(--custom-secondary);
          opacity: 0.8;
        }

        /* Animaciones adicionales para elementos interactivos */
        .group:hover .group-hover\\:scale-110 {
          transform: scale(1.1);
        }

        .group:hover .group-hover\\:translate-x-1 {
          transform: translateX(0.25rem);
        }

        /* Efecto de brillo dorado para tarjetas especiales */
        .golden-glow {
          box-shadow: 0 0 20px rgba(207, 138, 64, 0.3);
          border: 1px solid var(--custom-gold);
        }

        .golden-glow:hover {
          box-shadow: 0 0 30px rgba(207, 138, 64, 0.5);
          transform: translateY(-5px);
        }

        /* Efectos de partículas personalizadas */
        .particle-system {
          position: relative;
          overflow: hidden;
        }

        .particle-system::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, var(--custom-primary) 1px, transparent 1px);
          background-size: 50px 50px;
          opacity: 0.1;
          animation: float-slow 20s linear infinite;
        }

        /* Mejoras en la responsividad */
        @media (max-width: 768px) {
          .animate-slide-up-delay-1,
          .animate-slide-up-delay-2,
          .animate-slide-up-delay-3 {
            animation-delay: 0s;
          }

          .golden-glow {
            box-shadow: 0 0 15px rgba(207, 138, 64, 0.2);
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
          background-color: var(--custom-background);
        }

        /* Mejora en las transiciones de colores personalizados */
        * {
          transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Efectos de animación para texto con colores personalizados */
        .text-glow {
          text-shadow: 0 0 10px var(--custom-primary);
        }

        .text-gold-glow {
          text-shadow: 0 0 10px var(--custom-gold);
        }

        /* Patrones de fondo personalizados */
        .custom-pattern {
          background-image: 
            radial-gradient(circle at 25px 25px, var(--custom-primary) 2%, transparent 0%),
            radial-gradient(circle at 75px 75px, var(--custom-secondary) 2%, transparent 0%);
          background-size: 100px 100px;
          opacity: 0.05;
        }

        /* Efectos hover mejorados */
        .hover-lift {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(115, 199, 227, 0.2);
        }

        /* Animaciones de entrada escalonadas */
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }

        /* Efectos de botones personalizados */
        .btn-custom {
          background: linear-gradient(135deg, var(--custom-primary), var(--custom-secondary));
          border: none;
          color: white;
          font-weight: 600;
          letter-spacing: 0.5px;
          position: relative;
          overflow: hidden;
        }

        .btn-custom::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, var(--custom-gold), var(--custom-primary));
          transition: left 0.3s ease;
        }

        .btn-custom:hover::before {
          left: 0;
        }

        .btn-custom span {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </div>
  );
}