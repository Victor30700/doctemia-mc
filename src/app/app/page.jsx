'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function UserHomePage() {
  const { user, role } = useAuth();
  const { isDark } = useTheme();

  const fullName = user?.fullName || '';
  const universidad = user?.universidad || '';

  const slides = [
    { id: 1, title: 'Aprende Medicina', description: 'Explora cursos especializados', image: '/icons/Fondo DOCTEMIA.png' },
    { id: 2, title: 'Comunidad', description: 'Conecta con otros estudiantes', image: '/icons/udemy.png' },
    { id: 3, title: 'Certifícate', description: 'Obtén tu diploma digital', image: '/icons/1.png' },
  ];
  const [current, setCurrent] = useState(0);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  const sectionBg = isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900';
  const cardBg = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const controlBg = isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800';

  return (
    <section className={`relative min-h-screen p-8 transition-colors ${sectionBg}`}>  
      <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500 to-yellow-400 rounded-full opacity-20 pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight mb-1">Bienvenido, {user.email}</h1>
          {fullName && <p className="text-lg opacity-75">Nombre: {fullName}</p>}
          {universidad && <p className="text-lg opacity-75">Universidad: {universidad}</p>}
        </div>
      </div>

      {/* Carrusel con proporción responsive 16:9 */}
      <div className="relative w-full aspect-[16/9] mb-10 overflow-hidden rounded-2xl shadow-xl">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${index === current ? 'opacity-100' : 'opacity-0'}`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover"
              priority={index === current}
            />
            <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-60 p-4">
              <h3 className="text-2xl font-semibold text-white">{slide.title}</h3>
              <p className="text-white mt-1">{slide.description}</p>
            </div>
          </div>
        ))}
        <button
          onClick={prevSlide}
          className={`absolute top-1/2 left-4 -translate-y-1/2 p-2 rounded-full shadow transition ${controlBg} hover:opacity-80`}>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className={`absolute top-1/2 right-4 -translate-y-1/2 p-2 rounded-full shadow transition ${controlBg} hover:opacity-80`}>
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-16">
        <Link
          href="/app/courses"
          className={`block border ${cardBg} p-6 rounded-xl shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-1`}>
          <h2 className="text-2xl font-semibold mb-2">Cursos</h2>
          <p className="opacity-75">Accede a tus cursos disponibles</p>
        </Link>
        <Link
          href="/app/profile"
          className={`block border ${cardBg} p-6 rounded-xl shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-1`}>
          <h2 className="text-2xl font-semibold mb-2">Mi Perfil</h2>
          <p className="opacity-75">Ver y editar tu información</p>
        </Link>
      </div>
    </section>
  );
}
