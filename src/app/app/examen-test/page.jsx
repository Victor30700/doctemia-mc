'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import { LockKeyhole, Send, Hourglass } from 'lucide-react';

const NOMBRE_NEGOCIO = 'DOCTEMIA MC';

// --- Componente AccessDeniedScreen (UNIFICADO Y CORREGIDO) ---
const AccessDeniedScreen = ({ user, isDark, swalTheme }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [contactInfo, setContactInfo] = useState({ qrUrl: '', adminPhone: '' });
    
    useEffect(() => {
        const checkRequestAndLoadInfo = async () => {
            if (user) {
                // ✅ CORRECCIÓN 1: Buscar en 'pagoUnico_solicitudes'.
                // Esto asegura que el admin vea la solicitud en su panel actual.
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
            title: '<h3 class="text-2xl font-bold" style="color: #2E4A70;">¡Solicita tu Acceso!</h3>',
            html: `
                <div class="text-left space-y-4 p-4" style="color: ${isDark ? '#F0F2F2' : '#2E4A70'};">
                    <p class="text-center">Para acceder a esta sección, necesitas el acceso de Pago Único. Completa el pago usando el QR y luego contáctanos por WhatsApp para una activación inmediata.</p>
                    <div class="flex justify-center my-4">
                        ${contactInfo.qrUrl ? `<img src="${contactInfo.qrUrl}" alt="Código QR de Pago" class="w-48 h-48 rounded-lg" style="border: 2px solid ${isDark ? '#2E4A70' : '#73C7E3'};"/>` : '<p>Código QR no disponible.</p>'}
                    </div>
                    <p class="text-center font-semibold">¿Ya pagaste?</p>
                    <a id="whatsapp-link" href="https://api.whatsapp.com/send?phone=${contactInfo.adminPhone}&text=${encodeURIComponent(`Hola ${NOMBRE_NEGOCIO}, soy ${user.name || user.displayName}. Acabo de realizar el pago para el acceso de PAGO ÚNICO. Adjunto mi comprobante.`)}" target="_blank" style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; background-color: #24B0BA; color: white; font-weight: bold; padding: 12px 16px; border-radius: 8px; text-decoration: none; transition: all 0.3s;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        Contactar por WhatsApp
                    </a>
                    <div class="relative my-4">
                        <div class="absolute inset-0 flex items-center"><span class="w-full" style="border-top: 1px solid ${isDark ? '#2E4A70' : '#73C7E3'};"></span></div>
                        <div class="relative flex justify-center text-xs uppercase"><span style="background-color: ${isDark ? '#2E4A70' : '#FFF9F0'}; padding: 0 8px; color: #CF8A40;"> O </span></div>
                    </div>
                    <p class="text-center">Si prefieres, envía una solicitud y te contactaremos.</p>
                    <input id="swal-input-phone" class="swal2-input" placeholder="Tu número de WhatsApp (ej: +591...)" type="tel" style="border: 2px solid #73C7E3; border-radius: 8px; padding: 12px;">
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
                    // ✅ CORRECCIÓN 2: Crea la solicitud en 'pagoUnico_solicitudes'.
                    await addDoc(collection(db, "pagoUnico_solicitudes"), { 
                        userId: user.uid, 
                        userName: user.name || user.displayName, 
                        userEmail: user.email, 
                        userPhone: result.value.phone, 
                        requestDate: serverTimestamp(), 
                        status: 'pendiente', 
                        type: 'pago_unico_access' // Usamos un tipo genérico para que el admin sepa qué aprobar.
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
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center p-6" style={{ backgroundColor: '#FFF9F0' }}>
            <LockKeyhole className="h-20 w-20 mb-6" style={{ color: '#2E4A70' }} />
            <h1 className="text-3xl font-bold" style={{ color: '#2E4A70' }}>Acceso Restringido</h1>
            <p className="mt-4 max-w-md text-lg" style={{ color: '#2E4A70' }}>Para acceder a los exámenes de test, necesitas el acceso de Pago Único.</p>
            <div className="mt-8">
                {requestSent ? (
                    <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: '#CF8A40', color: '#FFF9F0' }}>
                        <Hourglass className="h-6 w-6" /> 
                        <span className="font-semibold">Tu solicitud está pendiente.</span>
                    </div>
                ) : (
                    <button 
                        onClick={handleRequestAccessPopup} 
                        disabled={isSubmitting} 
                        className="inline-flex items-center gap-3 rounded-md px-6 py-3 text-lg font-semibold text-white shadow-sm transition-all duration-300 disabled:opacity-50"
                        style={{ 
                            backgroundColor: isSubmitting ? '#F0F2F2' : '#24B0BA',
                            transform: isSubmitting ? 'none' : 'translateY(0)',
                        }}
                        onMouseEnter={(e) => {
                            if (!isSubmitting) {
                                e.target.style.backgroundColor = '#73C7E3';
                                e.target.style.transform = 'translateY(-2px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isSubmitting) {
                                e.target.style.backgroundColor = '#24B0BA';
                                e.target.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        {isSubmitting ? 'Procesando...' : 'Solicitar Acceso Ahora'} 
                        <Send className="h-5 w-5" />
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Iconos SVG (Incluidos para que el código esté completo) ---
const FileTextIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);
const ClockIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const EyeIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

// --- Modal para visualizar respuestas (Sin cambios) ---
function AttemptAnswersModal({ attempt, exam, onClose, isDark }) {
    if (!attempt || !exam) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div 
                className="rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
                style={{ backgroundColor: isDark ? '#2E4A70' : '#FFF9F0', color: isDark ? '#F0F2F2' : '#2E4A70' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4" style={{ borderBottom: `1px solid ${isDark ? '#73C7E3' : '#F0F2F2'}` }}>
                    <h2 className="text-xl font-bold">Tus Respuestas del Examen</h2>
                    <p className="text-sm opacity-75">{exam.title}</p>
                    <p className="text-sm opacity-75">Realizado el: {new Date(attempt.completedAt.seconds * 1000).toLocaleString()}</p>
                </div>
                <div className="overflow-y-auto p-6 space-y-4">
                    {exam.questions.map((question, index) => {
                        const userAnswer = attempt.answers.find(a => a.questionIndex === index);
                        return (
                            <div 
                                key={index} 
                                className="p-4 rounded-lg"
                                style={{ backgroundColor: isDark ? '#73C7E3' : '#F0F2F2' }}
                            >
                                <p className="font-semibold mb-2">{index + 1}. {question.questionText}</p>
                                {question.type === 'open-ended' ? (
                                    <div>
                                        <p 
                                            className="p-2 rounded text-sm italic"
                                            style={{ backgroundColor: isDark ? '#2E4A70' : '#FFF9F0', color: isDark ? '#F0F2F2' : '#2E4A70' }}
                                        >
                                            {userAnswer?.textAnswer || "No contestada"}
                                        </p>
                                    </div>
                                ) : (
                                    <p 
                                        className="p-2 rounded text-sm italic"
                                        style={{ backgroundColor: isDark ? '#2E4A70' : '#FFF9F0', color: isDark ? '#F0F2F2' : '#2E4A70' }}
                                    >
                                        {userAnswer?.selectedOptionIndex !== null ? `Seleccionaste: "${question.options[userAnswer.selectedOptionIndex]}"` : "No contestada"}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="px-6 py-3 text-right" style={{ borderTop: `1px solid ${isDark ? '#73C7E3' : '#F0F2F2'}` }}>
                    <button 
                        onClick={onClose} 
                        className="px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
                        style={{ 
                            backgroundColor: isDark ? '#73C7E3' : '#24B0BA', 
                            color: '#FFF9F0' 
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = isDark ? '#24B0BA' : '#73C7E3';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = isDark ? '#73C7E3' : '#24B0BA';
                        }}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Componente Principal de la Página (CORREGIDO) ---
export default function ExamenTestPage() {
    const { user, loading: authLoading } = useAuth();
    const [examsWithAttempts, setExamsWithAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAttempt, setSelectedAttempt] = useState(null);
    const [viewingExam, setViewingExam] = useState(null);
    const { isDark } = useTheme();

    const swalTheme = {
        background: isDark ? '#2E4A70' : '#FFF9F0', 
        color: isDark ? '#F0F2F2' : '#2E4A70',
        confirmButtonColor: '#24B0BA', 
        cancelButtonColor: '#CF8A40',
    };

    useEffect(() => {
        // No necesitamos el onAuthStateChanged aquí, useAuth ya lo maneja.
        if (!user) {
            setLoading(false);
            return;
        }
        
        // ✅ CORRECCIÓN 3: Verificar 'hasPagoUnicoAccess'.
        // Este es el cambio más importante. Ahora la página busca el permiso correcto.
        if (!user.hasPagoUnicoAccess) {
            setLoading(false);
            return; // Si no tiene acceso, no intentes cargar los exámenes.
        }

        const fetchExamsAndAttempts = async () => {
            // Ya hemos verificado el acceso, así que no necesitamos volver a poner setLoading(true) aquí.
            try {
                const attemptsQuery = query(collection(db, 'examAttempts'), where('userId', '==', user.uid));
                const attemptsSnapshot = await getDocs(attemptsQuery);
                const userAttempts = {};
                attemptsSnapshot.forEach(doc => {
                    const attempt = { id: doc.id, ...doc.data() };
                    if (!userAttempts[attempt.examId]) { userAttempts[attempt.examId] = []; }
                    userAttempts[attempt.examId].push(attempt);
                });

                const examsQuery = query(collection(db, 'exams'), where('status', '==', 'active'));
                const examsSnapshot = await getDocs(examsQuery);
                const examsData = examsSnapshot.docs.map(doc => {
                    const exam = { id: doc.id, ...doc.data() };
                    const attempts = (userAttempts[exam.id] || []).sort((a, b) => b.completedAt.seconds - a.completedAt.seconds);
                    return { ...exam, attempts };
                });

                setExamsWithAttempts(examsData);
            } catch (error) {
                console.error('Error al cargar exámenes y resultados:', error);
            } finally {
                setLoading(false); // Ponemos el loading en false al final de la carga de datos.
            }
        };
        
        fetchExamsAndAttempts();
    }, [user]); // El useEffect se ejecuta cada vez que el objeto 'user' cambia.

    const handleViewAnswers = (attempt, exam) => {
        setSelectedAttempt(attempt);
        setViewingExam(exam);
    };

    // --- Lógica de Renderizado Ordenada ---

    // 1. Mostrar estado de carga principal mientras se verifica el usuario.
    if (authLoading) {
        return (
            <div className="min-h-screen p-8" style={{ backgroundColor: '#FFF9F0' }}>
                <h1 className="text-3xl font-bold mb-6" style={{ color: '#2E4A70' }}>Exámenes Disponibles</h1>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <div 
                            key={i} 
                            className="rounded-xl p-6 animate-pulse shadow-lg"
                            style={{ backgroundColor: isDark ? '#2E4A70' : '#F0F2F2' }}
                        >
                            <div 
                                className="h-6 rounded w-3/4 mb-3"
                                style={{ backgroundColor: isDark ? '#73C7E3' : '#24B0BA' }}
                            ></div>
                            <div 
                                className="h-4 rounded w-full mb-2"
                                style={{ backgroundColor: isDark ? '#73C7E3' : '#24B0BA' }}
                            ></div>
                            <div 
                                className="h-4 rounded w-5/6 mb-5"
                                style={{ backgroundColor: isDark ? '#73C7E3' : '#24B0BA' }}
                            ></div>
                            <div 
                                className="h-10 rounded w-full"
                                style={{ backgroundColor: '#73C7E3' }}
                            ></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 2. Si no hay usuario, pedir que inicie sesión.
    if (!user) {
        return (
            <div 
                className="flex justify-center items-center h-screen"
                style={{ backgroundColor: '#FFF9F0' }}
            >
                <p style={{ color: '#2E4A70' }}>
                    Por favor, <Link href="/login" className="hover:underline" style={{ color: '#24B0BA' }}>inicia sesión</Link> para continuar.
                </p>
            </div>
        );
    }
    
    // 3. Si hay usuario PERO no tiene el permiso correcto, mostrar la pantalla de acceso denegado.
    // ✅ CORRECCIÓN 4: Verificar 'hasPagoUnicoAccess' aquí también.
    if (!user.hasPagoUnicoAccess) {
        return <AccessDeniedScreen user={user} isDark={isDark} swalTheme={swalTheme} />;
    }

    // 4. Si pasó todas las verificaciones, mostrar el contenido principal.
    return (
        <>
            <div 
                className="min-h-screen p-4 sm:p-8 transition-colors"
                style={{ backgroundColor: '#FFF9F0' }}
            >
                <h1 className="text-3xl font-bold mb-8" style={{ color: '#2E4A70' }}>Exámenes Disponibles</h1>
                {loading ? (
                    <p className="text-center" style={{ color: '#2E4A70' }}>Cargando exámenes...</p>
                ) : examsWithAttempts.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-lg" style={{ color: '#2E4A70' }}>No hay exámenes disponibles en este momento.</p>
                    </div>
                ) : (
                    <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                        {examsWithAttempts.map(exam => (
                            <div 
                                key={exam.id} 
                                className="flex flex-col rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
                                style={{ 
                                    backgroundColor: isDark ? '#2E4A70' : '#F0F2F2',
                                    border: `1px solid ${isDark ? '#73C7E3' : '#24B0BA'}`
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                                }}
                            >
                                <div className="p-6">
                                    <h2 
                                        className="text-2xl font-bold mb-2"
                                        style={{ color: isDark ? '#FFF9F0' : '#2E4A70' }}
                                    >
                                        {exam.title}
                                    </h2>
                                    <p 
                                        className="text-sm mb-4 flex-grow"
                                        style={{ color: isDark ? '#73C7E3' : '#2E4A70' }}
                                    >
                                        {exam.description || "Este examen pondrá a prueba tus conocimientos."}
                                    </p>
                                    <div className="flex items-center space-x-6 text-sm mb-6">
                                        <span 
                                            className="flex items-center gap-2"
                                            style={{ color: isDark ? '#CF8A40' : '#24B0BA' }}
                                        >
                                            <FileTextIcon className="h-5 w-5" />
                                            <span>{exam.questions.length} Preguntas</span>
                                        </span>
                                        {exam.timer && (
                                            <span 
                                                className="flex items-center gap-2"
                                                style={{ color: isDark ? '#CF8A40' : '#24B0BA' }}
                                            >
                                                <ClockIcon className="h-5 w-5" />
                                                <span>{exam.timer} Minutos</span>
                                            </span>
                                        )}
                                    </div>
                                    <Link 
                                        href={`/app/examen-test/examen?examId=${exam.id}`} 
                                        className="block w-full text-center font-semibold rounded-lg px-4 py-3 transition-all duration-300"
                                        style={{ backgroundColor: '#24B0BA', color: '#FFF9F0' }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#73C7E3';
                                            e.target.style.transform = 'scale(1.02)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = '#24B0BA';
                                            e.target.style.transform = 'scale(1)';
                                        }}
                                    >
                                        Comenzar Examen
                                    </Link>
                                </div>
                                {exam.attempts.length > 0 && (
                                    <div 
                                        className="p-6"
                                        style={{ borderTop: `1px solid ${isDark ? '#73C7E3' : '#24B0BA'}` }}
                                    >
                                        <h3 
                                            className="text-sm font-bold uppercase mb-3"
                                            style={{ color: isDark ? '#CF8A40' : '#24B0BA' }}
                                        >
                                            Tus Intentos Anteriores
                                        </h3>
                                        <ul className="space-y-3">
                                            {exam.attempts.map(attempt => (
                                                <li 
                                                    key={attempt.id} 
                                                    className="flex justify-between items-center p-3 rounded-lg"
                                                    style={{ backgroundColor: isDark ? '#73C7E3' : '#FFF9F0' }}
                                                >
                                                    <div>
                                                        <p 
                                                            className="font-semibold"
                                                            style={{ color: isDark ? '#2E4A70' : '#2E4A70' }}
                                                        >
                                                            Calificación: {attempt.score}/100
                                                        </p>
                                                        <p 
                                                            className="text-xs"
                                                            style={{ color: isDark ? '#2E4A70' : '#24B0BA' }}
                                                        >
                                                            {new Date(attempt.completedAt.seconds * 1000).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleViewAnswers(attempt, exam)} 
                                                        className="p-2 rounded-full transition-all duration-200"
                                                        style={{ backgroundColor: 'transparent' }}
                                                        title="Ver tus respuestas"
                                                        onMouseEnter={(e) => {
                                                            e.target.style.backgroundColor = isDark ? '#2E4A70' : '#24B0BA';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.backgroundColor = 'transparent';
                                                        }}
                                                    >
                                                        <EyeIcon 
                                                            className="h-5 w-5"
                                                            style={{ color: isDark ? '#2E4A70' : '#24B0BA' }}
                                                        />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {selectedAttempt && viewingExam && (
                <AttemptAnswersModal 
                    attempt={selectedAttempt} 
                    exam={viewingExam} 
                    onClose={() => setSelectedAttempt(null)} 
                    isDark={isDark} 
                />
            )}
        </>
    );
}