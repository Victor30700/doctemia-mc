// src/app/app/clases-en-vivo/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import Link from 'next/link';

import { Copy, Check, LockKeyhole, Send, Hourglass } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';

dayjs.extend(duration);
dayjs.extend(relativeTime);

const NOMBRE_NEGOCIO = 'DOCTEMIA MC';

// Componente AccessDeniedScreen para clases en vivo
const AccessDeniedScreen = ({ user, isDark, swalTheme }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [contactInfo, setContactInfo] = useState({ qrUrl: '', adminPhone: '' });
    
    useEffect(() => {
        const checkRequestAndLoadInfo = async () => {
            if (user) {
                const q = query(collection(db, "pagoUnico_solicitudes"), where("userId", "==", user.uid), where("status", "==", "pendiente"));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    setRequestSent(true);
                }
            }
            const contactInfoRef = doc(db, 'pags', 'infoContacto');
            const docSnap = await getDoc(contactInfoRef);
            if (docSnap.exists()) {
                setContactInfo(docSnap.data());
            }
        };
        checkRequestAndLoadInfo();
    }, [user]);

    const handleRequestAccessPopup = () => {
        Swal.fire({
            title: '<h3 class="text-2xl font-bold text-indigo-500">¡Solicita tu Acceso!</h3>',
            html: `
                <div class="text-left space-y-4 p-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}">
                    <p class="text-center">Completa el pago usando el QR y luego contáctanos por WhatsApp para una activación inmediata.</p>
                    <div class="flex justify-center my-4">
                        ${contactInfo.qrUrl ? `<img src="${contactInfo.qrUrl}" alt="Código QR de Pago" class="w-48 h-48 rounded-lg border-2 ${isDark ? 'border-gray-600' : 'border-gray-300'}"/>` : '<p>Código QR no disponible.</p>'}
                    </div>
                    <p class="text-center font-semibold">¿Ya pagaste?</p>
                    <a id="whatsapp-link" href="https://api.whatsapp.com/send?phone=${contactInfo.adminPhone}&text=${encodeURIComponent(`Hola ${NOMBRE_NEGOCIO}, soy ${user.name || user.displayName}. Acabo de realizar el pago para el acceso a las clases en vivo. Adjunto mi comprobante.`)}" target="_blank" class="flex items-center justify-center gap-2 w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition hover:bg-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        Contactar por WhatsApp
                    </a>
                    <div class="relative my-4">
                        <div class="absolute inset-0 flex items-center"><span class="w-full border-t ${isDark ? 'border-gray-600' : 'border-gray-300'}"></span></div>
                        <div class="relative flex justify-center text-xs uppercase"><span class="bg-${isDark ? 'gray-800' : 'white'} px-2 text-gray-500"> O </span></div>
                    </div>
                    <p class="text-center">Si prefieres, envía una solicitud y te contactaremos.</p>
                    <input id="swal-input-phone" class="swal2-input" placeholder="Tu número de WhatsApp (ej: +591...)" type="tel">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Enviar Solicitud',
            cancelButtonText: 'Cancelar',
            ...swalTheme,
            customClass: { popup: isDark ? 'bg-gray-800' : 'bg-white' },
            preConfirm: () => {
                const phone = Swal.getPopup().querySelector('#swal-input-phone').value;
                if (!phone) { Swal.showValidationMessage(`Por favor, ingresa tu número de WhatsApp`); }
                return { phone };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                setIsSubmitting(true);
                try {
                    await addDoc(collection(db, "pagoUnico_solicitudes"), { 
                        userId: user.uid, 
                        userName: user.name || user.displayName, 
                        userEmail: user.email, 
                        userPhone: result.value.phone, 
                        requestDate: serverTimestamp(), 
                        status: 'pendiente', 
                        type: 'clases_vivo_access' 
                    });
                    setRequestSent(true);
                    Swal.fire({ title: '¡Solicitud Enviada!', text: 'Te contactaremos pronto.', icon: 'success', ...swalTheme });
                } catch (error) {
                    console.error("Error al crear solicitud:", error);
                    Swal.fire({ title: 'Error', text: 'No se pudo enviar tu solicitud.', icon: 'error', ...swalTheme });
                } finally {
                    setIsSubmitting(false);
                }
            }
        });
    };

    return (
        <div className={`flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <LockKeyhole className={`h-20 w-20 mb-6 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Acceso Restringido</h1>
            <p className={`mt-4 max-w-md text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Para acceder a las clases en vivo, necesitas la aprobación de un administrador.</p>
            <div className="mt-8">
                {requestSent ? (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-400/20 text-yellow-700 dark:text-yellow-300">
                        <Hourglass className="h-6 w-6" /> 
                        <span className="font-semibold">Tu solicitud está pendiente.</span>
                    </div>
                ) : (
                    <button 
                        onClick={handleRequestAccessPopup} 
                        disabled={isSubmitting} 
                        className="inline-flex items-center gap-3 rounded-md bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-gray-400"
                    >
                        {isSubmitting ? 'Procesando...' : 'Solicitar Acceso Ahora'} 
                        <Send className="h-5 w-5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default function ClasesEnVivoUsuario() {
  const { user, loading: authLoading } = useAuth();
  const { isDark, isLoaded } = useTheme();
  const [clases, setClases] = useState({ pasadas: [], hoy: [], futuras: [] });
  const [loading, setLoading] = useState(true);
  const [copiadoId, setCopiadoId] = useState(null);
  const [copiadoEnlace, setCopiadoEnlace] = useState(null);

  const swalTheme = {
    background: isDark ? '#1f2937' : '#ffffff', 
    color: isDark ? '#f9fafb' : '#111827',
    confirmButtonColor: '#4f46e5', 
    cancelButtonColor: '#ef4444',
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (!user.hasPagoUnicoAccess) {
      setLoading(false);
      return;
    }

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
  }, [user]);

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

  // Loading states y verificaciones de acceso
  if (authLoading || loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <p className={`animate-pulse ${isDark ? 'text-white' : 'text-black'}`}>Cargando Clases...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <p>Por favor, <Link href="/login" className="text-indigo-500 hover:underline">inicia sesión</Link> para continuar.</p>
      </div>
    );
  }

  if (!user.hasPagoUnicoAccess) {
    return <AccessDeniedScreen user={user} isDark={isDark} swalTheme={swalTheme} />;
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