'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
// --- ✅ MEJORA: Se importa updateDoc, arrayUnion y arrayRemove ---
import { collection, getDocs, query, where, doc, getDoc, onSnapshot, addDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Swal from 'sweetalert2';
// --- ✅ MEJORA: Se importan nuevos iconos ---
import { LockKeyhole, Send, Hourglass, BookOpen, Search, CheckCircle2, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const NOMBRE_NEGOCIO = 'DOCTEMIA MC';


const convertGoogleDriveUrl = (url) => {
  if (!url) return '/placeholder.png';
  
  if (url.includes('drive.google.com/uc?') || url.includes('drive.google.com/thumbnail?')) {
    return url;
  }
  
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) {
    const fileId = fileIdMatch[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  }
  
  return url;
};

// El componente AccessDeniedScreen corregido
const AccessDeniedScreen = ({ user, isDark, swalTheme }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [contactInfo, setContactInfo] = useState({ qrUrl: '', adminPhone: '' });
    const [showModal, setShowModal] = useState(false);
    const [phoneInput, setPhoneInput] = useState('');
    
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
        setShowModal(true);
    };

    const handleSubmitRequest = async () => {
        if (!phoneInput) {
            Swal.fire({ 
                title: 'Error', 
                text: 'Por favor, ingresa tu número de WhatsApp', 
                icon: 'error', 
                ...swalTheme 
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "pagoUnico_solicitudes"), { 
                userId: user.uid, 
                userName: user.name || user.displayName, 
                userEmail: user.email, 
                userPhone: phoneInput, 
                requestDate: serverTimestamp(), 
                status: 'pendiente', 
                type: 'pago_unico_access' 
            });
            setRequestSent(true);
            setShowModal(false);
            Swal.fire({ 
                title: '¡Solicitud Enviada!', 
                text: 'Te contactaremos pronto.', 
                icon: 'success', 
                ...swalTheme 
            });
        } catch (error) {
            console.error("Error al crear solicitud:", error);
            Swal.fire({ 
                title: 'Error', 
                text: 'No se pudo enviar tu solicitud.', 
                icon: 'error', 
                ...swalTheme 
            });
        } finally {
            setIsSubmitting(false);
        }
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

            {/* ✨ MODAL CUSTOM CON REACT */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className={`relative w-full max-w-md mx-4 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                        {/* Header del Modal */}
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-2xl font-bold text-indigo-500">¡Solicita tu Acceso!</h3>
                            <button 
                                onClick={() => setShowModal(false)} 
                                className={`text-gray-400 hover:text-gray-600 ${isDark ? 'hover:text-gray-300' : ''}`}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Contenido del Modal */}
                        <div className="p-6 space-y-4">
                            <p className={`text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Completa el pago usando el QR y luego contáctanos por WhatsApp para una activación inmediata.
                            </p>

                            {/* ✨ QR CON COMPONENTE IMAGE DE NEXT.JS */}
                            <div className="flex justify-center my-4">
                                {contactInfo.qrUrl ? (
                                    <div className={`w-48 h-48 rounded-lg border-2 overflow-hidden ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                                        <img 
                                            src={(() => {
                                                // Convertir URL de Google Drive a formato más confiable
                                                if (contactInfo.qrUrl.includes('drive.google.com/uc?export=view&id=')) {
                                                    const fileId = contactInfo.qrUrl.split('id=')[1];
                                                    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h400`;
                                                }
                                                return contactInfo.qrUrl;
                                            })()} 
                                            alt="Código QR de Pago" 
                                            className="w-full h-full object-cover"
                                            onLoad={() => console.log('QR cargado exitosamente')}
                                            onError={(e) => {
                                                console.log('Error cargando QR, probando URL alternativa...');
                                                // Si falla, probar con la URL original
                                                if (e.target.src !== contactInfo.qrUrl) {
                                                    e.target.src = contactInfo.qrUrl;
                                                } else {
                                                    // Si también falla, mostrar placeholder
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">QR no disponible</div>';
                                                }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <p className={`text-gray-500 ${isDark ? 'text-gray-400' : ''}`}>Código QR no disponible.</p>
                                )}
                            </div>

                            <p className={`text-center font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>¿Ya pagaste?</p>

                            {/* Botón WhatsApp */}
                            <a 
                                href={`https://api.whatsapp.com/send?phone=${contactInfo.adminPhone}&text=${encodeURIComponent(`Hola ${NOMBRE_NEGOCIO}, soy ${user.name || user.displayName}. Acabo de realizar el pago para el acceso a los cursos de pago único. Adjunto mi comprobante.`)}`}
                                target="_blank"
                                className="flex items-center justify-center gap-2 w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition hover:bg-green-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                                Contactar por WhatsApp
                            </a>

                            {/* Separador */}
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className={`w-full border-t ${isDark ? 'border-gray-600' : 'border-gray-300'}`}></span>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className={`px-2 text-gray-500 ${isDark ? 'bg-gray-800' : 'bg-white'}`}> O </span>
                                </div>
                            </div>

                            <p className={`text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Si prefieres, envía una solicitud y te contactaremos.</p>

                            {/* Input teléfono */}
                            <input
                                type="tel"
                                value={phoneInput}
                                onChange={(e) => setPhoneInput(e.target.value)}
                                placeholder="Tu número de WhatsApp (ej: +591...)"
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                            />
                        </div>

                        {/* Footer del Modal */}
                        <div className={`flex gap-3 p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                            <button 
                                onClick={() => setShowModal(false)} 
                                className={`flex-1 px-4 py-2 rounded-md border transition ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSubmitRequest}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 transition"
                            >
                                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Componente Principal de la Página ---
export default function CoursesPagoUnicoPage() {
    const { user, loading: authLoading } = useAuth();
    const { isDark } = useTheme();
    const router = useRouter(); 
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- ✅ MEJORA: Estados para el buscador y cursos completados ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [completedCourses, setCompletedCourses] = useState([]);

    const swalTheme = {
        background: isDark ? '#1f2937' : '#ffffff', color: isDark ? '#f9fafb' : '#111827',
        confirmButtonColor: '#4f46e5', cancelButtonColor: '#ef4444',
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

        // Cargar Cursos
        const coursesQuery = query(collection(db, "Cursos_Pago_Unico"), where("isActive", "==", true));
        const coursesUnsubscribe = onSnapshot(coursesQuery, (snapshot) => {
            const allCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCourses(allCourses);
            setLoading(false);
        });
        
        // Cargar Categorías
        const categoriesUnsubscribe = onSnapshot(collection(db, 'course_categories'), (snapshot) => {
            const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            cats.sort((a, b) => a.name.localeCompare(b.name));
            setCategories(cats);
        });

        // --- ✅ MEJORA: Cargar y escuchar cursos completados del usuario ---
        const userDocRef = doc(db, 'users', user.uid);
        const userUnsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                setCompletedCourses(doc.data().pagoUnicoCursosCompletados || []);
            }
        });

        return () => {
            coursesUnsubscribe();
            categoriesUnsubscribe();
            userUnsubscribe();
        };
    }, [user]);

    // --- ✅ MEJORA: Lógica para filtrar cursos antes de agruparlos ---
    const filteredCourses = useMemo(() => {
        return courses.filter(course => {
            const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
            const categoryName = categoryMap.get(course.categoryId) || '';
            
            const matchesSearchTerm = course.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory ? course.categoryId === selectedCategory : true;
            
            return matchesSearchTerm && matchesCategory;
        });
    }, [courses, searchTerm, selectedCategory, categories]);

    const groupedCourses = useMemo(() => {
        if (filteredCourses.length === 0) return {};
        const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
        const groups = {};
        const sortedCourses = [...filteredCourses].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        sortedCourses.forEach(course => {
            const date = (course.createdAt || course.updatedAt)?.toDate(); 
            const monthYearKey = date ? date.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase()) : 'Otros';
            const categoryName = categoryMap.get(course.categoryId) || 'Sin Categoría';

            if (!groups[monthYearKey]) groups[monthYearKey] = {};
            if (!groups[monthYearKey][categoryName]) groups[monthYearKey][categoryName] = [];
            groups[monthYearKey][categoryName].push(course);
        });
        return groups;
    }, [filteredCourses, categories]);

    // --- ✅ MEJORA: Función para marcar/desmarcar un curso como completado ---
    const handleToggleComplete = async (courseId, isCompleted) => {
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        try {
            await updateDoc(userDocRef, {
                pagoUnicoCursosCompletados: isCompleted ? arrayRemove(courseId) : arrayUnion(courseId)
            });
            Swal.fire({
                toast: true,
                icon: 'success',
                title: isCompleted ? 'Curso desmarcado' : '¡Curso completado!',
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
                ...swalTheme
            });
        } catch (error) {
            console.error("Error updating completed status:", error);
            Swal.fire({ title: 'Error', text: 'No se pudo actualizar el estado del curso.', icon: 'error', ...swalTheme });
        }
    };

    if (authLoading || loading) return <div className={`flex justify-center items-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}><p className={`animate-pulse ${isDark ? 'text-white' : 'text-black'}`}>Cargando Cursos...</p></div>;
    if (!user) return <div className={`flex justify-center items-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}><p>Por favor, <Link href="/login" className="text-indigo-500 hover:underline">inicia sesión</Link> para continuar.</p></div>;
    if (!user.hasPagoUnicoAccess) return <AccessDeniedScreen user={user} isDark={isDark} swalTheme={swalTheme} />;
    
    return (
        <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto">
                <h1 className={`text-4xl font-bold text-center mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Catálogo de Cursos</h1>
                
                {/* --- ✅ MEJORA: Barra de Búsqueda y Filtro --- */}
                <div className={`p-4 rounded-lg mb-10 shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                            <input
                                type="text"
                                placeholder="Buscar por título..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-indigo-500' : 'bg-white border-gray-300 focus:ring-indigo-600'}`}
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-indigo-500' : 'bg-white border-gray-300 focus:ring-indigo-600'}`}
                        >
                            <option value="">Todas las categorías</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

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
                                                {coursesInCategory.map(course => {
                                                    const isCompleted = completedCourses.includes(course.id);
                                                    return (
                                                        <div key={course.id} className={`relative flex flex-col rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                                            {/* --- ✅ MEJORA: Insignia de curso completado --- */}
                                                            {isCompleted && (
                                                                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1.5 z-10 shadow-lg">
                                                                    <CheckCircle2 size={20} />
                                                                </div>
                                                            )}
                                                            <div className="relative">
                                                                {/* ✨ CAMBIO PRINCIPAL: Usar componente Image de Next.js con mejor manejo */}
                                                                <Image 
                                                                    //src={course.imageUrl || '/placeholder.png'}

                                                                    /* ---------- */
                                                                    /* ------------ */
                                                                    /* Correccion para que funcione imagenes que drive */
                                                                    src={convertGoogleDriveUrl(course.imageUrl)}

                                                                    /*--------------------- */
                                                                    /*--------------------- */

                                                                    alt={course.title} 
                                                                    width={400}
                                                                    height={192}
                                                                    className="w-full h-48 object-cover"
                                                                    style={{ objectFit: 'cover' }}
                                                                    unoptimized={course.imageUrl?.includes('drive.google.com')}
                                                                    onError={() => {
                                                                        console.log('Error loading image:', course.imageUrl);
                                                                    }}
                                                                />
                                                                {isCompleted && <div className="absolute inset-0 bg-black/30"></div>}
                                                            </div>
                                                            <div className="p-6 flex flex-col flex-grow">
                                                                <h4 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{course.title}</h4>
                                                                <p className={`text-sm mb-4 flex-grow ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{course.description}</p>
                                                                <div className="mt-auto pt-4 space-y-2">
                                                                    <button onClick={() => handleToggleComplete(course.id, isCompleted)} className={`w-full inline-flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded-lg transition duration-300 text-sm ${isCompleted ? (isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700') : (isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800')}`}>
                                                                        {isCompleted ? <><CheckCircle2 size={16} /> Curso Visto</> : <><Bookmark size={16} /> Marcar como Visto</>}
                                                                    </button>
                                                                    <button onClick={() => router.push(`/app/pagoUnicoCourses/ContenidoCursos/${course.id}`)} className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition duration-300">
                                                                        <BookOpen size={20} /> Ver Contenido
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <h3 className="text-xl font-semibold">No se encontraron cursos</h3>
                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2`}>Intenta ajustar tu búsqueda o filtro de categoría.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
