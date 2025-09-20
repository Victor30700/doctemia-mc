// src/app/app/clases-en-vivo/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import Link from 'next/link';

import { Copy, Check, LockKeyhole, Send, Hourglass, Clock, User, Calendar, Link as LinkIcon } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';

dayjs.extend(duration);
dayjs.extend(relativeTime);

const NOMBRE_NEGOCIO = 'DOCTEMIA MC';

// Paleta de colores
const COLORS = {
  primary: '#014ba0',      // Turquesa principal
  secondary: '#014ba0',    // Azul oscuro
  accent: '#CF8A40',       // Naranja/Dorado
  dark: '#2E4A70',         // Azul oscuro
  neutral: '#F0F2F2',      // Gris claro
  background: '#FFF9F0'    // Fondo crema
};

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
            title: `<h3 class="text-2xl font-bold" style="color: ${COLORS.primary}">¡Solicita tu Acceso!</h3>`,
            html: `
                <div class="text-left space-y-4 p-4" style="color: ${isDark ? '#f3f4f6' : COLORS.dark};">
                    <p class="text-center">Completa el pago usando el QR y luego contáctanos por WhatsApp para una activación inmediata.</p>
                    <div class="flex justify-center my-4">
                        ${contactInfo.qrUrl ? `<img src="${contactInfo.qrUrl}" alt="Código QR de Pago" class="w-48 h-48 rounded-lg shadow-lg" style="border: 2px solid ${COLORS.secondary};"/>` : '<p>Código QR no disponible.</p>'}
                    </div>
                    <p class="text-center font-semibold">¿Ya pagaste?</p>
                    <a id="whatsapp-link" href="https://api.whatsapp.com/send?phone=${contactInfo.adminPhone}&text=${encodeURIComponent(`Hola ${NOMBRE_NEGOCIO}, soy ${user.name || user.displayName}. Acabo de realizar el pago para el acceso a las clases en vivo. Adjunto mi comprobante.`)}" target="_blank" class="flex items-center justify-center gap-2 w-full text-white font-bold py-3 px-4 rounded-lg transition hover:opacity-90" style="background-color: #25D366;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        Contactar por WhatsApp
                    </a>
                    <div class="relative my-4">
                        <div class="absolute inset-0 flex items-center"><span class="w-full" style="border-top: 1px solid ${COLORS.neutral};"></span></div>
                        <div class="relative flex justify-center text-xs uppercase"><span class="px-2" style="background-color: ${isDark ? '#1f2937' : '#ffffff'}; color: ${COLORS.dark};"> O </span></div>
                    </div>
                    <p class="text-center">Si prefieres, envía una solicitud y te contactaremos.</p>
                    <input id="swal-input-phone" class="swal2-input" placeholder="Tu número de WhatsApp (ej: +591...)" type="tel" style="border: 1px solid ${COLORS.secondary};">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Enviar Solicitud',
            cancelButtonText: 'Cancelar',
            ...swalTheme,
            confirmButtonColor: COLORS.primary,
            cancelButtonColor: COLORS.accent,
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
                    Swal.fire({ 
                        title: '¡Solicitud Enviada!', 
                        text: 'Te contactaremos pronto.', 
                        icon: 'success', 
                        confirmButtonColor: COLORS.primary,
                        ...swalTheme 
                    });
                } catch (error) {
                    console.error("Error al crear solicitud:", error);
                    Swal.fire({ 
                        title: 'Error', 
                        text: 'No se pudo enviar tu solicitud.', 
                        icon: 'error', 
                        confirmButtonColor: COLORS.primary,
                        ...swalTheme 
                    });
                } finally {
                    setIsSubmitting(false);
                }
            }
        });
    };

    return (
        <div 
            className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center p-6"
            style={{ backgroundColor: COLORS.background }}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
                style={{ 
                    background: `linear-gradient(135deg, ${COLORS.background} 0%, white 100%)`,
                    border: `1px solid ${COLORS.neutral}`
                }}
            >
                <div 
                    className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${COLORS.secondary}20` }}
                >
                    <LockKeyhole 
                        className="h-10 w-10" 
                        style={{ color: COLORS.primary }}
                    />
                </div>
                
                <h1 
                    className="text-3xl font-bold mb-4"
                    style={{ color: COLORS.dark }}
                >
                    Acceso Restringido
                </h1>
                
                <p 
                    className="mb-8 text-lg leading-relaxed"
                    style={{ color: COLORS.dark, opacity: 0.8 }}
                >
                    Para acceder a las clases en vivo, necesitas la aprobación de un administrador.
                </p>
                
                <div className="mt-8">
                    {requestSent ? (
                        <div 
                            className="flex items-center gap-3 p-4 rounded-xl font-semibold"
                            style={{ 
                                backgroundColor: `${COLORS.accent}20`,
                                color: COLORS.accent,
                                border: `1px solid ${COLORS.accent}40`
                            }}
                        >
                            <Hourglass className="h-6 w-6" /> 
                            <span>Tu solicitud está pendiente.</span>
                        </div>
                    ) : (
                        <button 
                            onClick={handleRequestAccessPopup} 
                            disabled={isSubmitting} 
                            className="inline-flex items-center gap-3 rounded-xl px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100 w-full justify-center"
                            style={{ 
                                backgroundColor: COLORS.primary,
                                boxShadow: `0 10px 30px ${COLORS.primary}30`
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    Solicitar Acceso Ahora
                                    <Send className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    )}
                </div>
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
    color: isDark ? '#f9fafb' : COLORS.dark,
    confirmButtonColor: COLORS.primary, 
    cancelButtonColor: COLORS.accent,
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
    toast.success('Copiado al portapapeles', {
      style: {
        background: COLORS.primary,
        color: 'white',
      },
    });
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
      <div 
        className="min-h-screen p-8 transition-colors flex items-center justify-center"
        style={{ backgroundColor: COLORS.background }}
      >
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: COLORS.primary, borderTopColor: 'transparent' }}></div>
          <p style={{ color: COLORS.dark }}>Cargando tema...</p>
        </div>
      </div>
    );
  }

  // Loading states y verificaciones de acceso
  if (authLoading || loading) {
    return (
      <div 
        className="flex justify-center items-center h-screen"
        style={{ backgroundColor: COLORS.background }}
      >
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: COLORS.primary, borderTopColor: 'transparent' }}></div>
          <p className="animate-pulse text-xl font-semibold" style={{ color: COLORS.dark }}>
            Cargando Clases...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div 
        className="flex justify-center items-center h-screen"
        style={{ backgroundColor: COLORS.background }}
      >
        <div 
          className="text-center p-8 rounded-2xl shadow-lg"
          style={{ backgroundColor: 'white', border: `1px solid ${COLORS.neutral}` }}
        >
          <p style={{ color: COLORS.dark }}>
            Por favor, <Link href="/login" className="font-semibold hover:underline" style={{ color: COLORS.primary }}>inicia sesión</Link> para continuar.
          </p>
        </div>
      </div>
    );
  }

  if (!user.hasPagoUnicoAccess) {
    return <AccessDeniedScreen user={user} isDark={isDark} swalTheme={swalTheme} />;
  }

  const renderClaseCard = (clase, tipo) => {
    const inicio = dayjs(`${clase.fecha}T${clase.hora}`);
    const ahora = dayjs();
    const tiempoRestante = inicio.diff(ahora);

    const getCardGradient = (tipo) => {
      switch (tipo) {
        case 'hoy':
          return `linear-gradient(135deg, ${COLORS.primary}10 0%, ${COLORS.secondary}10 100%)`;
        case 'futuras':
          return `linear-gradient(135deg, ${COLORS.secondary}10 0%, white 100%)`;
        default:
          return `linear-gradient(135deg, ${COLORS.neutral} 0%, white 100%)`;
      }
    };

    const getCardBorder = (tipo) => {
      switch (tipo) {
        case 'hoy':
          return COLORS.primary;
        case 'futuras':
          return COLORS.secondary;
        default:
          return COLORS.neutral;
      }
    };

    return (
      <div
        key={clase.id}
        className="p-6 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105"
        style={{ 
          background: getCardGradient(tipo),
          borderColor: getCardBorder(tipo),
          borderWidth: '1px'
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ 
              backgroundColor: tipo === 'hoy' ? COLORS.primary : tipo === 'futuras' ? COLORS.secondary : COLORS.neutral 
            }}
          ></div>
          <h3 
            className="text-xl font-bold"
            style={{ color: COLORS.dark }}
          >
            {clase.titulo}
          </h3>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4" style={{ color: COLORS.primary }} />
            <p style={{ color: COLORS.dark }}>
              <span className="font-semibold">Fecha:</span> {clase.fecha}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4" style={{ color: COLORS.primary }} />
            <p style={{ color: COLORS.dark }}>
              <span className="font-semibold">Hora:</span> {clase.hora}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Hourglass className="w-4 h-4" style={{ color: COLORS.primary }} />
            <p style={{ color: COLORS.dark }}>
              <span className="font-semibold">Duración:</span> {clase.duracion}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <User className="w-4 h-4" style={{ color: COLORS.primary }} />
            <p style={{ color: COLORS.dark }}>
              <span className="font-semibold">Expositor:</span> {clase.expositor}
            </p>
          </div>
        </div>

        {clase.descripcion && (
          <div 
            className="p-3 rounded-lg mb-4"
            style={{ backgroundColor: `${COLORS.neutral}50` }}
          >
            <p style={{ color: COLORS.dark }}>
              <span className="font-semibold">Descripción:</span> {clase.descripcion}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <LinkIcon className="w-4 h-4" style={{ color: COLORS.primary }} />
          <p style={{ color: COLORS.dark }}>
            <span className="font-semibold">Enlace:</span>{' '}
            <a
              href={clase.enlace}
              target="_blank"
              className="font-semibold hover:underline transition-colors"
              style={{ color: COLORS.primary }}
            >
              Unirse a la clase
            </a>
          </p>
        </div>

        {tipo === 'hoy' && (
          <>
            <div 
              className="p-3 rounded-lg mb-4 text-center font-semibold"
              style={{ 
                backgroundColor: tiempoRestante > 0 ? `${COLORS.accent}20` : `${COLORS.primary}20`,
                color: tiempoRestante > 0 ? COLORS.accent : COLORS.primary
              }}
            >
              {tiempoRestante > 0
                ? `⏰ Empieza en ${dayjs.duration(tiempoRestante).humanize()}`
                : '🔴 La clase ya debería haber comenzado'}
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => copiar(clase.enlace, 'enlace', clase.id)}
                className="flex-1 min-w-0 px-4 py-2 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: COLORS.primary,
                  boxShadow: `0 4px 15px ${COLORS.primary}30`
                }}
              >
                {copiadoEnlace === clase.id ? (
                  <Check size={16} />
                ) : (
                  <Copy size={16} />
                )}
                <span className="text-sm">Copiar enlace</span>
              </button>
              
              {clase.idReunion && (
                <button
                  onClick={() => copiar(clase.idReunion, 'id', clase.id)}
                  className="flex-1 min-w-0 px-4 py-2 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                  style={{ 
                    backgroundColor: COLORS.secondary,
                    boxShadow: `0 4px 15px ${COLORS.secondary}30`
                  }}
                >
                  {copiadoId === clase.id ? (
                    <Check size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                  <span className="text-sm">Copiar ID</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const tipos = ['hoy', 'futuras', 'pasadas'];

  const getSectionIcon = (tipo) => {
    switch (tipo) {
      case 'hoy': return '🔴';
      case 'futuras': return '📅';
      case 'pasadas': return '📋';
      default: return '📚';
    }
  };

  const getSectionTitle = (tipo) => {
    switch (tipo) {
      case 'hoy': return 'Clases de Hoy';
      case 'futuras': return 'Clases Futuras';
      case 'pasadas': return 'Clases Pasadas';
      default: return 'Clases';
    }
  };

  return (
    <section 
      className="min-h-screen transition-colors"
      style={{ backgroundColor: COLORS.background }}
    >
      {/* Header con gradiente */}
      <div 
        className="p-6 pb-8"
        style={{ 
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎓 Clases en Vivo
          </h1>
          <p className="text-white/80 text-lg">
            Accede a todas tus clases programadas en tiempo real
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto p-6 -mt-4">
        <div className="space-y-8">
          {tipos.map(tipo => (
            <div key={tipo} className="space-y-4">
              <div 
                className="flex items-center gap-3 p-4 rounded-2xl"
                style={{ 
                  background: `linear-gradient(135deg, white 0%, ${COLORS.neutral} 100%)`,
                  border: `1px solid ${COLORS.neutral}`
                }}
              >
                <span className="text-2xl">{getSectionIcon(tipo)}</span>
                <h2 
                  className="text-2xl font-bold"
                  style={{ color: COLORS.dark }}
                >
                  {getSectionTitle(tipo)}
                </h2>
                <div 
                  className="ml-auto px-3 py-1 rounded-full text-sm font-semibold"
                  style={{ 
                    backgroundColor: `${COLORS.primary}20`,
                    color: COLORS.primary 
                  }}
                >
                  {clases[tipo].length}
                </div>
              </div>
              
              {clases[tipo].length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {clases[tipo].map(clase => renderClaseCard(clase, tipo))}
                </div>
              ) : (
                <div 
                  className="text-center p-12 rounded-2xl"
                  style={{ 
                    backgroundColor: 'white',
                    border: `1px dashed ${COLORS.neutral}`
                  }}
                >
                  <div 
                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${COLORS.neutral}50` }}
                  >
                    <span className="text-2xl">📚</span>
                  </div>
                  <p 
                    className="text-lg"
                    style={{ color: COLORS.dark, opacity: 0.6 }}
                  >
                    No hay clases {tipo === 'hoy' ? 'para hoy' : tipo}.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: COLORS.primary,
            color: 'white',
            border: 'none',
            borderRadius: '12px',
          },
        }}
      />
    </section>
  );
}