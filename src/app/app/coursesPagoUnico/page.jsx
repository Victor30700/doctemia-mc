'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Swal from 'sweetalert2';
import { LockKeyhole, Send, Hourglass, BookOpen, ChevronDown, Video, ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';

const NOMBRE_NEGOCIO = 'DOCTEMIA MC';

// --- Componente para la pantalla de "Acceso Denegado" ---
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
                    <a id="whatsapp-link" href="https://api.whatsapp.com/send?phone=${contactInfo.adminPhone}&text=${encodeURIComponent(`Hola ${NOMBRE_NEGOCIO}, soy ${user.name || user.displayName}. Acabo de realizar el pago para el acceso a los cursos de pago único. Adjunto mi comprobante.`)}" target="_blank" class="flex items-center justify-center gap-2 w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition hover:bg-green-600">
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
            customClass: {
                popup: isDark ? 'bg-gray-800' : 'bg-white',
            },
            preConfirm: () => {
                const phone = Swal.getPopup().querySelector('#swal-input-phone').value;
                if (!phone) {
                    Swal.showValidationMessage(`Por favor, ingresa tu número de WhatsApp`);
                }
                return { phone };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                setIsSubmitting(true);
                try {
                    await addDoc(collection(db, "pagoUnico_solicitudes"), { userId: user.uid, userName: user.name || user.displayName, userEmail: user.email, userPhone: result.value.phone, requestDate: serverTimestamp(), status: 'pendiente', type: 'pago_unico_access' });
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
            <p className={`mt-4 max-w-md text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Para ver el catálogo de cursos de pago único, necesitas la aprobación de un administrador.</p>
            <div className="mt-8">
                {requestSent ? (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-400/20 text-yellow-700 dark:text-yellow-300"><Hourglass className="h-6 w-6" /> <span className="font-semibold">Tu solicitud está pendiente.</span></div>
                ) : (
                    <button onClick={handleRequestAccessPopup} disabled={isSubmitting} className="inline-flex items-center gap-3 rounded-md bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-gray-400">{isSubmitting ? 'Procesando...' : 'Solicitar Acceso Ahora'} <Send className="h-5 w-5" /></button>
                )}
            </div>
        </div>
    );
};

// --- Componente para mostrar el contenido de un curso específico ---
const CourseContentView = ({ course, onBack, isDark }) => {
    const [openModule, setOpenModule] = useState(0);

    return (
        <div className="max-w-5xl mx-auto">
            <button onClick={onBack} className={`inline-flex items-center gap-2 mb-8 text-sm font-semibold transition-colors ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}>
                <ArrowLeft size={18} /> Volver al Catálogo
            </button>
            <div className={`p-6 sm:p-8 rounded-2xl shadow-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h1 className={`text-3xl sm:text-4xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{course.title}</h1>
                <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{course.description}</p>
                {course.summaryDriveLink && (
                    <a href={course.summaryDriveLink} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 mb-8 text-sm font-semibold rounded-full px-4 py-2 transition ${isDark ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                        <FileText size={16} /> Ver Resumen del Curso
                    </a>
                )}
                
                <h2 className={`text-2xl font-semibold mb-4 border-b pb-2 ${isDark ? 'text-indigo-400 border-gray-700' : 'text-indigo-600 border-gray-300'}`}>Contenido del Curso</h2>
                <div className="space-y-4">
                    {course.modules?.map((module, index) => (
                        <div key={index} className={`rounded-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
                            <button onClick={() => setOpenModule(openModule === index ? -1 : index)} className={`w-full flex justify-between items-center p-4 text-left font-semibold text-lg ${isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                <span>{module.title}</span>
                                <ChevronDown className={`transition-transform ${openModule === index ? 'rotate-180' : ''}`} />
                            </button>
                            {openModule === index && (
                                <ul className={`p-4 space-y-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                                    {module.videos?.map((video, vIndex) => (
                                        <li key={vIndex} className={`flex items-center justify-between p-3 rounded-md ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/50'}`}>
                                            <span className="flex items-center gap-3">
                                                <Video size={20} className="text-indigo-500" />
                                                {video.title}
                                            </span>
                                            <a href={video.url} target="_blank" rel="noopener noreferrer" className={`text-sm font-bold text-indigo-500 hover:underline`}>
                                                Ver Video
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


// --- Componente Principal de la Página ---
export default function CoursesPagoUnicoPage() {
    const { user, loading: authLoading } = useAuth();
    const { isDark } = useTheme();
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState(null);

    const swalTheme = {
        background: isDark ? '#1f2937' : '#ffffff', color: isDark ? '#f9fafb' : '#111827',
        confirmButtonColor: '#4f46e5', cancelButtonColor: '#ef4444',
    };

    useEffect(() => {
        if (!user || !user.hasPagoUnicoAccess) {
            setLoading(false);
            return;
        }

        const coursesQuery = query(collection(db, "Cursos_Pago_Unico"), where("isActive", "==", true));
        const coursesUnsubscribe = onSnapshot(coursesQuery, (snapshot) => {
            const allCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCourses(allCourses);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching courses:", error);
            setLoading(false);
        });
        
        const categoriesUnsubscribe = onSnapshot(collection(db, 'course_categories'), (snapshot) => {
            setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            coursesUnsubscribe();
            categoriesUnsubscribe();
        };
    }, [user]);

    const groupedCourses = useMemo(() => {
        if (courses.length === 0) return {};

        const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
        const groups = {};

        courses.sort((a, b) => {
            const dateA = a.createdAt || a.updatedAt;
            const dateB = b.createdAt || b.updatedAt;
            return (dateB?.seconds || 0) - (dateA?.seconds || 0);
        });
        
        courses.forEach(course => {
            const date = (course.createdAt || course.updatedAt)?.toDate(); 
            
            const monthYearKey = date
                ? date.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())
                : 'Otros';

            const categoryName = categoryMap.get(course.categoryId) || 'Sin Categoría';

            if (!groups[monthYearKey]) groups[monthYearKey] = {};
            if (!groups[monthYearKey][categoryName]) groups[monthYearKey][categoryName] = [];
            groups[monthYearKey][categoryName].push(course);
        });
        return groups;
    }, [courses, categories]);

    if (authLoading || loading) {
        return <div className={`flex justify-center items-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}><p className={`animate-pulse ${isDark ? 'text-white' : 'text-black'}`}>Cargando Cursos...</p></div>;
    }
    if (!user) {
        return <div className={`flex justify-center items-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}><p>Por favor, <Link href="/login" className="text-indigo-500 hover:underline">inicia sesión</Link> para continuar.</p></div>;
    }
    if (!user.hasPagoUnicoAccess) {
        return <AccessDeniedScreen user={user} isDark={isDark} swalTheme={swalTheme} />;
    }
    
    return (
        <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {selectedCourse ? (
                <CourseContentView course={selectedCourse} onBack={() => setSelectedCourse(null)} isDark={isDark} />
            ) : (
                <div className="max-w-7xl mx-auto">
                    <h1 className={`text-4xl font-bold text-center mb-12 ${isDark ? 'text-white' : 'text-gray-900'}`}>Mis Cursos</h1>
                    {Object.keys(groupedCourses).length > 0 ? (
                        <div className="space-y-12">
                            {Object.entries(groupedCourses).map(([monthYear, categoriesInMonth]) => (
                                <div key={monthYear}>
                                    <h2 className={`text-2xl font-bold mb-6 pb-2 border-b-2 ${isDark ? 'text-blue-400 border-blue-400/30' : 'text-blue-600 border-blue-600/30'}`}>{monthYear}</h2>
                                    <div className="space-y-8">
                                        {Object.entries(categoriesInMonth).map(([categoryName, coursesInCategory]) => (
                                            <div key={categoryName}>
                                                <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{categoryName}</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                    {coursesInCategory.map(course => (
                                                        <div key={course.id} className={`flex flex-col rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                                            <img src={course.imageUrl || '/placeholder.png'} alt={course.title} className="w-full h-48 object-cover" />
                                                            <div className="p-6 flex flex-col flex-grow">
                                                                <h4 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{course.title}</h4>
                                                                <p className={`text-sm mb-4 h-24 overflow-hidden ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{course.description}</p>
                                                                <div className="mt-auto">
                                                                    <button onClick={() => setSelectedCourse(course)} className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition duration-300">
                                                                        <BookOpen size={20} /> Ver Curso
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-16">No hay cursos disponibles en este momento.</p>
                    )}
                </div>
            )}
        </div>
    );
}