'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../lib/firebase'; // Corregido: Ruta relativa ajustada
import { collection, getDocs, query, where, doc, getDoc, onSnapshot, addDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext'; // Corregido: Ruta relativa ajustada
import { useTheme } from '../../../context/ThemeContext'; // Corregido: Ruta relativa ajustada
import Swal from 'sweetalert2';
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

// El componente AccessDeniedScreen corregido con paleta de colores
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
        <div style={{ backgroundColor: '#FFF9F0' }} className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center p-6">
            <LockKeyhole className="h-20 w-20 mb-6" style={{ color: '#24B0BA' }} />
            <h1 className="text-3xl font-bold" style={{ color: '#2E4A70' }}>Acceso Restringido</h1>
            <p className="mt-4 max-w-md text-lg" style={{ color: '#2E4A70', opacity: 0.8 }}>Para ver el catálogo de cursos de pago único, necesitas la aprobación de un administrador.</p>
            <div className="mt-8">
                {requestSent ? (
                    <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(207, 138, 64, 0.2)' }}>
                        <Hourglass className="h-6 w-6" style={{ color: '#CF8A40' }} />
                        <span className="font-semibold" style={{ color: '#CF8A40' }}>Tu solicitud está pendiente.</span>
                    </div>
                ) : (
                    <button 
                        onClick={handleRequestAccessPopup} 
                        disabled={isSubmitting} 
                        className="inline-flex items-center gap-3 rounded-md px-6 py-3 text-lg font-semibold text-white shadow-sm disabled:opacity-50 transition-all hover:scale-105"
                        style={{ backgroundColor: '#24B0BA' }}
                    >
                        {isSubmitting ? 'Procesando...' : 'Solicitar Acceso Ahora'} <Send className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* ✨ MODAL CUSTOM CON REACT */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="relative w-full max-w-md mx-4 rounded-lg shadow-lg" style={{ backgroundColor: '#FFF9F0' }}>
                        {/* Header del Modal */}
                        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#F0F2F2' }}>
                            <h3 className="text-2xl font-bold" style={{ color: '#24B0BA' }}>¡Solicita tu Acceso!</h3>
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Contenido del Modal */}
                        <div className="p-6 space-y-4">
                            <p className="text-center" style={{ color: '#2E4A70' }}>
                                Completa el pago usando el QR y luego contáctanos por WhatsApp para una activación inmediata.
                            </p>

                            {/* ✨ QR CON COMPONENTE IMAGE DE NEXT.JS */}
                            <div className="flex justify-center my-4">
                                {contactInfo.qrUrl ? (
                                    <div className="w-48 h-48 rounded-lg border-2 overflow-hidden" style={{ borderColor: '#73C7E3' }}>
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
                                    <p className="text-gray-500">Código QR no disponible.</p>
                                )}
                            </div>

                            <p className="text-center font-semibold" style={{ color: '#2E4A70' }}>¿Ya pagaste?</p>

                            {/* Botón WhatsApp */}
                            <a 
                                href={`https://api.whatsapp.com/send?phone=${contactInfo.adminPhone}&text=${encodeURIComponent(`Hola ${NOMBRE_NEGOCIO}, soy ${user.name || user.displayName}. Acabo de realizar el pago para el acceso a los cursos de pago único. Adjunto mi comprobante.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full text-white font-bold py-3 px-4 rounded-lg transition hover:opacity-90"
                                style={{ backgroundColor: '#24B0BA' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                                Contactar por WhatsApp
                            </a>

                            {/* Separador */}
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" style={{ borderColor: '#F0F2F2' }}></span>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="px-2" style={{ backgroundColor: '#FFF9F0', color: '#2E4A70' }}> O </span>
                                </div>
                            </div>

                            <p className="text-center" style={{ color: '#2E4A70' }}>Si prefieres, envía una solicitud y te contactaremos.</p>

                            {/* Input teléfono */}
                            <input
                                type="tel"
                                value={phoneInput}
                                onChange={(e) => setPhoneInput(e.target.value)}
                                placeholder="Tu número de WhatsApp (ej: +591...)"
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2"
                                style={{ borderColor: '#73C7E3', backgroundColor: 'white' }}
                            />
                        </div>

                        {/* Footer del Modal */}
                        <div className="flex gap-3 p-6 border-t" style={{ borderColor: '#F0F2F2' }}>
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="flex-1 px-4 py-2 rounded-md border transition hover:opacity-80"
                                style={{ borderColor: '#73C7E3', color: '#2E4A70', backgroundColor: 'white' }}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSubmitRequest}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 text-white rounded-md transition hover:opacity-90 disabled:opacity-50"
                                style={{ backgroundColor: '#24B0BA' }}
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
        background: isDark ? '#1f2937' : '#ffffff', 
        color: isDark ? '#f9fafb' : '#111827',
        confirmButtonColor: '#24B0BA', 
        cancelButtonColor: '#CF8A40',
    };

    useEffect(() => {
        if (!user || !user.hasPagoUnicoAccess) {
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
            const matchesSearchTerm = course.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory ? course.categoryId === selectedCategory : true;
            return matchesSearchTerm && matchesCategory;
        });
    }, [courses, searchTerm, selectedCategory]);

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

    if (authLoading || loading) return (
        <div className="flex justify-center items-center h-screen" style={{ backgroundColor: '#FFF9F0' }}>
            <p className="animate-pulse" style={{ color: '#2E4A70' }}>Cargando Cursos...</p>
        </div>
    );
    
    if (!user) return (
        <div className="flex justify-center items-center h-screen" style={{ backgroundColor: '#FFF9F0' }}>
            <p>Por favor, <Link href="/login" className="hover:underline" style={{ color: '#24B0BA' }}>inicia sesión</Link> para continuar.</p>
        </div>
    );
    
    if (!user.hasPagoUnicoAccess) return <AccessDeniedScreen user={user} isDark={isDark} swalTheme={swalTheme} />;
    
    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: '#FFF9F0' }}>
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-6" style={{ color: '#2E4A70' }}>Catálogo de Cursos</h1>
                
                {/* --- ✅ MEJORA: Barra de Búsqueda y Filtro --- */}
                <div className="p-4 rounded-lg mb-10 shadow-md" style={{ backgroundColor: 'white' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: '#73C7E3' }} />
                            <input
                                type="text"
                                placeholder="Buscar por título..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2"
                                style={{ 
                                    borderColor: '#73C7E3', 
                                    backgroundColor: '#F0F2F2',
                                    color: '#2E4A70'
                                }}
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2"
                            style={{ 
                                borderColor: '#73C7E3', 
                                backgroundColor: '#F0F2F2',
                                color: '#2E4A70'
                            }}
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
                                <h2 className="text-2xl font-bold mb-6 pb-2 border-b-2" 
                                    style={{ 
                                        color: '#24B0BA', 
                                        borderColor: 'rgba(115, 199, 227, 0.3)' 
                                    }}>
                                    {monthYear}
                                </h2>
                                <div className="space-y-8">
                                    {Object.entries(categoriesInMonth).map(([categoryName, coursesInCategory]) => (
                                        <div key={categoryName}>
                                            <h3 className="text-xl font-semibold mb-4" style={{ color: '#2E4A70' }}>{categoryName}</h3>
                                            
                                            {/* 🎨 AQUÍ ESTÁ LA MEJORA: De 'columns' a 'grid' */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                {coursesInCategory.map((course) => {
                                                    const isCompleted = completedCourses.includes(course.id);
                                                    
                                                    return (
                                                        <div 
                                                            key={course.id} 
                                                            className="relative flex flex-col rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border"
                                                            style={{ 
                                                                backgroundColor: 'white',
                                                                borderColor: '#F0F2F2',
                                                            }}
                                                        >
                                                            {/* Insignia de curso completado */}
                                                            {isCompleted && (
                                                                <div className="absolute top-2 right-2 text-white rounded-full p-1.5 z-10 shadow-lg" 
                                                                    style={{ backgroundColor: '#24B0BA' }}>
                                                                    <CheckCircle2 size={20} />
                                                                </div>
                                                            )}
                                                            <div className="relative">
                                                                {/* Altura de imagen fija para uniformidad */}
                                                                <div className="w-full h-48 overflow-hidden" 
                                                                    style={{ backgroundColor: '#F0F2F2' }}>
                                                                    <Image 
                                                                        src={convertGoogleDriveUrl(course.imageUrl)}
                                                                        alt={course.title} 
                                                                        width={400}
                                                                        height={300}
                                                                        className="w-full h-full object-cover"
                                                                        unoptimized={course.imageUrl?.includes('drive.google.com')}
                                                                    />
                                                                </div>
                                                                {isCompleted && <div className="absolute inset-0 bg-black/30"></div>}
                                                            </div>
                                                            <div className="p-6 flex flex-col flex-grow">
                                                                <h4 className="text-xl font-bold mb-2" style={{ color: '#2E4A70' }}>
                                                                    {course.title}
                                                                </h4>
                                                                <p className="text-sm mb-4 flex-grow" style={{ color: '#2E4A70', opacity: 0.7 }}>
                                                                    {course.description}
                                                                </p>
                                                                <div className="mt-auto pt-4 space-y-2">
                                                                    <button 
                                                                        onClick={() => handleToggleComplete(course.id, isCompleted)} 
                                                                        className="w-full inline-flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded-lg transition duration-300 text-sm"
                                                                        style={{ 
                                                                            backgroundColor: isCompleted ? 'rgba(115, 199, 227, 0.2)' : '#F0F2F2',
                                                                            color: isCompleted ? '#24B0BA' : '#2E4A70'
                                                                        }}
                                                                    >
                                                                        {isCompleted ? 
                                                                            <><CheckCircle2 size={16} /> Curso Visto</> : 
                                                                            <><Bookmark size={16} /> Marcar como Visto</>
                                                                        }
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => router.push(`/app/pagoUnicoCourses/ContenidoCursos/${course.id}`)} 
                                                                        className="w-full inline-flex items-center justify-center gap-2 text-white font-bold py-3 px-4 rounded-lg transition duration-300 hover:opacity-90"
                                                                        style={{ backgroundColor: '#24B0BA' }}
                                                                    >
                                                                        <BookOpen size={20} /> Ver Contenido
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
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
                        <h3 className="text-xl font-semibold" style={{ color: '#2E4A70' }}>No se encontraron cursos</h3>
                        <p className="mt-2" style={{ color: '#2E4A70', opacity: 0.7 }}>
                            Intenta ajustar tu búsqueda o filtro de categoría.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}