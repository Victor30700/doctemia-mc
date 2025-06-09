// src/app/app/clases-en-vivo/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import Link from 'next/link';

import { Copy, Check } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useTheme } from '@/context/ThemeContext';

dayjs.extend(duration);
dayjs.extend(relativeTime);

export default function ClasesEnVivoUsuario() {
  const [clases, setClases] = useState({ pasadas: [], hoy: [], futuras: [] });
  const [loading, setLoading] = useState(true);
  const [copiadoId, setCopiadoId] = useState(null);
  const [copiadoEnlace, setCopiadoEnlace] = useState(null);

  // Tema claro/oscuro
  const { isDark, isLoaded } = useTheme();

  useEffect(() => {
    const cargarClases = async () => {
      const snapshot = await getDocs(collection(db, 'clasesEnVivo'));
      const hoy = dayjs().format('YYYY-MM-DD');
      const todas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const pasadas = [], hoyClases = [], futuras = [];

      todas.forEach(clase => {
        if (!clase.fecha) return;
        const fecha = dayjs(clase.fecha);
        if (fecha.isBefore(hoy, 'day')) pasadas.push(clase);
        else if (fecha.isSame(hoy, 'day')) hoyClases.push(clase);
        else futuras.push(clase);
      });

      setClases({ pasadas, hoy: hoyClases, futuras });
      setLoading(false);
    };

    cargarClases();
  }, []);

  const copiar = (texto, tipo, id) => {
    navigator.clipboard.writeText(texto);
    toast.success('Copiado al portapapeles');
    if (tipo === 'enlace') {
      setCopiadoEnlace(id);
      setTimeout(() => setCopiadoEnlace(null), 2000);
    } else {
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 2000);
    }
  };

  // Placeholder hasta que cargue el tema
  if (!isLoaded) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 transition-colors dark:bg-gray-900">
        <p className="text-center text-gray-700 dark:text-gray-300">Cargando tema...</p>
      </div>
    );
  }

  // Clases de Tailwind dinámicas
  const containerBg = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const titleText = isDark ? 'text-blue-300' : 'text-blue-700';
  const sectionTitle = isDark ? 'text-gray-200' : 'text-gray-800';
  const bodyText = isDark ? 'text-gray-200' : 'text-gray-800';
  const metaText = isDark ? 'text-gray-400' : 'text-gray-600';
  const cardBg = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const linkClass = isDark ? 'text-blue-400 underline' : 'text-blue-600 underline';
  const buttonBg = isDark
    ? 'bg-blue-600 hover:bg-blue-500 text-white'
    : 'bg-blue-500 hover:bg-blue-600 text-white';

  const renderClaseCard = (clase, tipo) => {
    const inicio = dayjs(`${clase.fecha}T${clase.hora}`);
    const ahora = dayjs();
    const tiempoRestante = inicio.diff(ahora);

    return (
      <div
        key={clase.id}
        className={`p-4 flex flex-col gap-2 rounded-lg shadow-md border transition-colors ${cardBg}`}
      >
        <h3 className={`text-lg font-semibold ${titleText}`}>
          {clase.titulo}
        </h3>
        <p className={bodyText}>
          <strong>Fecha:</strong> {clase.fecha}
        </p>
        <p className={bodyText}>
          <strong>Hora:</strong> {clase.hora}
        </p>
        <p className={bodyText}>
          <strong>Duración:</strong> {clase.duracion}
        </p>
        <p className={bodyText}>
          <strong>Expositor:</strong> {clase.expositor}
        </p>
        {clase.descripcion && (
          <p className={bodyText}>
            <strong>Descripción:</strong> {clase.descripcion}
          </p>
        )}
        <p className={bodyText}>
          <strong>Enlace:</strong>{' '}
          <a
            href={clase.enlace}
            target="_blank"
            className={`${linkClass}`}
          >
            Unirse a la clase
          </a>
        </p>
        {tipo === 'hoy' && (
          <>
            <p className={`text-sm mt-1 ${metaText}`}>
              {tiempoRestante > 0
                ? `Empieza en ${dayjs.duration(tiempoRestante).humanize()}`
                : 'La clase ya debería haber comenzado'}
            </p>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => copiar(clase.enlace, 'enlace', clase.id)}
                className={`text-sm px-3 py-1 rounded flex items-center gap-1 transition ${buttonBg}`}
              >
                {copiadoEnlace === clase.id ? (
                  <Check size={14} />
                ) : (
                  <Copy size={14} />
                )}{' '}
                Copiar enlace
              </button>
              {clase.idReunion && (
                <button
                  onClick={() => copiar(clase.idReunion, 'id', clase.id)}
                  className={`text-sm px-3 py-1 rounded flex items-center gap-1 transition ${buttonBg}`}
                >
                  {copiadoId === clase.id ? (
                    <Check size={14} />
                  ) : (
                    <Copy size={14} />
                  )}{' '}
                  Copiar ID
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-8 ${containerBg} transition-colors`}>
        <p className={`text-center ${bodyText}`}>Cargando clases...</p>
      </div>
    );
  }

  // Reemplazamos la parte con `as const` por un array normal
  const tipos = ['hoy', 'futuras', 'pasadas'];

  return (
    <section className={`p-6 min-h-screen transition-colors ${containerBg}`}>
      <h1 className={`text-2xl font-bold mb-6 ${titleText}`}>
        Clases en Vivo
      </h1>
      <div className="space-y-6">
        {tipos.map(tipo => (
          <div key={tipo}>
            <h2 className={`text-xl font-semibold mb-2 ${sectionTitle}`}>
              {tipo === 'hoy'
                ? '📆 Clases de Hoy'
                : tipo === 'futuras'
                ? '📅 Clases Futuras'
                : '🕓 Clases Pasadas'}
            </h2>
            {clases[tipo].length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clases[tipo].map(clase => renderClaseCard(clase, tipo))}
              </div>
            ) : (
              <p className={metaText}>
                No hay clases {tipo === 'hoy' ? 'para hoy' : tipo}.
              </p>
            )}
          </div>
        ))}
      </div>
      <Toaster position="top-right" />
    </section>
  );
}
