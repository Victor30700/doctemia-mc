
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs, query, where, doc, getDoc, onSnapshot, addDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import Swal from 'sweetalert2';
import { LockKeyhole, Send, Hourglass, BookOpen, Search, CheckCircle2, Bookmark, Filter, Grid3X3, List } from 'lucide-react';
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
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w500`;
  }
  return url;
};

// Componente de Pantalla de Acceso Denegado
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
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8 text-center transform hover:scale-105 transition-all duration-300">
                <div className="w-24 h-24 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <LockKeyhole className="h-12 w-12 text-white" />
                </div>
                
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Acceso Restringido</h1>
                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                    Para acceder al catálogo exclusivo de cursos de pago único, necesitas la aprobación de nuestro equipo.
                </p>

                <div className="space-y-4">
                    {requestSent ? (
                        <div className="flex items-center justify-center gap-3 p-4 bg-amber-100 rounded-lg border-l-4 border-amber-400">
                            <Hourglass className="h-6 w-6 text-amber-600 animate-spin" />
                            <span className="font-semibold text-amber-800">Tu solicitud está en proceso</span>
                        </div>
                    ) : (
                        <button 
                            onClick={handleRequestAccessPopup} 
                            disabled={isSubmitting} 
                            className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Procesando...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Send className="h-5 w-5" />
                                    Solicitar Acceso Ahora
                                </span>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Modal Mejorado */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl transform scale-100 transition-all duration-300">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                                ¡Obtén tu Acceso!
                            </h3>
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <p className="text-center text-gray-700 leading-relaxed">
                                Realiza el pago usando el código QR y contáctanos vía WhatsApp para activación inmediata.
                            </p>

                            {/* QR Code */}
                            <div className="flex justify-center">
                                {contactInfo.qrUrl ? (
                                    <div className="w-56 h-56 rounded-2xl border-4 border-gradient-to-r from-teal-400 to-blue-500 overflow-hidden shadow-lg">
                                        <img 
                                            src={(() => {
                                                if (contactInfo.qrUrl.includes('drive.google.com/uc?export=view&id=')) {
                                                    const fileId = contactInfo.qrUrl.split('id=')[1];
                                                    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h400`;
                                                }
                                                return contactInfo.qrUrl;
                                            })()} 
                                            alt="Código QR de Pago" 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-56 h-56 bg-gray-100 rounded-2xl flex items-center justify-center">
                                        <p className="text-gray-500">QR no disponible</p>
                                    </div>
                                )}
                            </div>

                            <div className="text-center">
                                <p className="font-semibold text-gray-800 mb-4">¿Ya completaste el pago?</p>
                                
                                <a 
                                    href={`https://api.whatsapp.com/send?phone=${contactInfo.adminPhone}&text=${encodeURIComponent(`Hola ${NOMBRE_NEGOCIO}, soy ${user.name || user.displayName}. He realizado el pago para acceso a cursos premium. Adjunto comprobante.`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-3 w-full bg-green-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-600 transition-colors shadow-lg hover:shadow-xl"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                    </svg>
                                    Contactar por WhatsApp
                                </a>
                            </div>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-300"></span>
                                </div>
                                <div className="relative flex justify-center text-sm uppercase font-semibold">
                                    <span className="px-4 bg-white text-gray-500">O solicita contacto</span>
                                </div>
                            </div>

                            <input
                                type="tel"
                                value={phoneInput}
                                onChange={(e) => setPhoneInput(e.target.value)}
                                placeholder="Tu número de WhatsApp (+591...)"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-200">
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSubmitRequest}
                                disabled={isSubmitting || !phoneInput}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:from-teal-600 hover:to-blue-700 transition-all disabled:opacity-50 font-medium"
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

// Componente de Tarjeta de Curso
const CourseCard = ({ course, isCompleted, onToggleComplete, onViewContent }) => (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2">
        <div className="relative overflow-hidden">
            <div className="aspect-video w-full bg-gradient-to-br from-gray-100 to-gray-200">
                <Image 
                    src={convertGoogleDriveUrl(course.imageUrl)}
                    alt={course.title} 
                    width={400}
                    height={250}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized={course.imageUrl?.includes('drive.google.com')}
                />
            </div>
            
            {/* Badge de completado */}
            {isCompleted && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-full p-2.5 shadow-lg animate-pulse">
                    <CheckCircle2 size={20} />
                </div>
            )}
            
            {/* Overlay para cursos completados */}
            {isCompleted && (
                <div className="absolute inset-0 bg-gradient-to-t from-teal-900/50 to-transparent"></div>
            )}
        </div>

        <div className="p-6 flex flex-col">
            <h4 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-teal-600 transition-colors">
                {course.title}
            </h4>
            
            <p className="text-gray-600 text-sm mb-6 line-clamp-3 flex-grow leading-relaxed">
                {course.description}
            </p>

            <div className="space-y-3 mt-auto">
                <button 
                    onClick={() => onToggleComplete(course.id, isCompleted)} 
                    className={`w-full inline-flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-xl transition-all duration-300 ${
                        isCompleted 
                            ? 'bg-gradient-to-r from-teal-100 to-blue-100 text-teal-700 hover:from-teal-200 hover:to-blue-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    {isCompleted ? 
                        <><CheckCircle2 size={18} /> Curso Completado</> : 
                        <><Bookmark size={18} /> Marcar como Completado</>
                    }
                </button>
                
                <button 
                    onClick={() => onViewContent(course.id)} 
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:from-teal-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                    <BookOpen size={20} /> 
                    Ver Contenido
                </button>
            </div>
        </div>
    </div>
);

// Componente Principal
export default function CoursesPagoUnicoPage() {
    const { user, loading: authLoading } = useAuth();
    const { isDark } = useTheme();
    const router = useRouter(); 
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [completedCourses, setCompletedCourses] = useState([]);
    const [viewMode, setViewMode] = useState('list');

    const swalTheme = {
        background: isDark ? '#1f2937' : '#ffffff', 
        color: isDark ? '#f9fafb' : '#111827',
        confirmButtonColor: '#14B8A6', 
        cancelButtonColor: '#F59E0B',
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

        // Cargar cursos completados del usuario
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

    // Filtrar cursos
    const filteredCourses = useMemo(() => {
        return courses.filter(course => {
            const matchesSearchTerm = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    course.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory ? course.categoryId === selectedCategory : true;
            return matchesSearchTerm && matchesCategory;
        });
    }, [courses, searchTerm, selectedCategory]);

    // Agrupar cursos por categoría
    const groupedCourses = useMemo(() => {
        if (filteredCourses.length === 0) return {};
        const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
        const groups = {};
        const sortedCourses = [...filteredCourses].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        sortedCourses.forEach(course => {
            const categoryName = categoryMap.get(course.categoryId) || 'Sin Categoría';

            if (!groups[categoryName]) groups[categoryName] = [];
            groups[categoryName].push(course);
        });
        return groups;
    }, [filteredCourses, categories]);

    // Función para marcar/desmarcar como completado
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
                title: isCompleted ? 'Marcado como pendiente' : '¡Curso completado!',
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
                ...swalTheme
            });
        } catch (error) {
            console.error("Error updating completed status:", error);
            Swal.fire({ 
                title: 'Error', 
                text: 'No se pudo actualizar el estado del curso.', 
                icon: 'error', 
                ...swalTheme 
            });
        }
    };

    const handleViewContent = (courseId) => {
        router.push(`/app/pagoUnicoCourses/ContenidoCursos/${courseId}`);
    };

    if (authLoading || loading) return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex justify-center items-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-xl font-semibold text-gray-700">Cargando Cursos...</p>
            </div>
        </div>
    );
    
    if (!user) return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex justify-center items-center p-4">
            <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
                <p className="text-xl text-gray-700 mb-4">Por favor, inicia sesión para continuar.</p>
                <Link href="/login" className="inline-block bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:from-teal-600 hover:to-blue-700 transition-all">
                    Iniciar Sesión
                </Link>
            </div>
        </div>
    );
    
    if (!user.hasPagoUnicoAccess) return <AccessDeniedScreen user={user} isDark={isDark} swalTheme={swalTheme} />;
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-4">
                        Catálogo de Cursos
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Accede a nuestros cursos exclusivos de pago único y potencia tu aprendizaje
                    </p>
                </div>

                {/* Barra de búsqueda y filtros */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-10 backdrop-blur-lg">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                        {/* Búsqueda */}
                        <div className="lg:col-span-5 relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Buscar Cursos
                            </label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por título o descripción..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Filtro por categoría */}
                        <div className="lg:col-span-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Filtrar por Categoría
                            </label>
                            <div className="relative">
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full pl-12 pr-8 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all appearance-none bg-white"
                                >
                                    <option value="">Todas las categorías</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Controles de vista */}
                        <div className="lg:col-span-3 flex justify-end">
                            <div className="flex bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                        viewMode === 'grid' 
                                            ? 'bg-white text-teal-600 shadow-md' 
                                            : 'text-gray-600 hover:text-teal-600'
                                    }`}
                                >
                                    <Grid3X3 size={18} />
                                    Grid
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                        viewMode === 'list' 
                                            ? 'bg-white text-teal-600 shadow-md' 
                                            : 'text-gray-600 hover:text-teal-600'
                                    }`}
                                >
                                    <List size={18} />
                                    Lista
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                            <span>Total: {filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>Completados: {completedCourses.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span>Pendientes: {filteredCourses.length - completedCourses.filter(id => filteredCourses.some(course => course.id === id)).length}</span>
                        </div>
                    </div>
                </div>

                {/* Contenido de cursos */}
                {Object.keys(groupedCourses).length > 0 ? (
                    <div className="space-y-12">
                        {/* Categorías */}
                        {Object.entries(groupedCourses).map(([categoryName, coursesInCategory]) => (
                            <div key={categoryName}>
                                {/* Título de la categoría */}
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center">
                                        <BookOpen className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-800">{categoryName}</h3>
                                        <p className="text-gray-600">{coursesInCategory.length} curso{coursesInCategory.length !== 1 ? 's' : ''} disponible{coursesInCategory.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                
                                {/* Grid de cursos - RESPONSIVO CON 3 COLUMNAS */}
                                <div className={viewMode === 'grid' 
                                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8" 
                                    : "space-y-6"
                                }>
                                    {coursesInCategory.map((course) => {
                                        const isCompleted = completedCourses.includes(course.id);
                                        
                                        return viewMode === 'grid' ? (
                                            <CourseCard
                                                key={course.id}
                                                course={course}
                                                isCompleted={isCompleted}
                                                onToggleComplete={handleToggleComplete}
                                                onViewContent={handleViewContent}
                                            />
                                        ) : (
                                            // Vista de lista
                                            <div key={course.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                                                <div className="flex flex-col sm:flex-row">
                                                    <div className="sm:w-80 h-48 sm:h-auto relative flex-shrink-0">
                                                        <Image 
                                                            src={convertGoogleDriveUrl(course.imageUrl)}
                                                            alt={course.title} 
                                                            width={320}
                                                            height={200}
                                                            className="w-full h-full object-cover"
                                                            unoptimized={course.imageUrl?.includes('drive.google.com')}
                                                        />
                                                        {isCompleted && (
                                                            <>
                                                                <div className="absolute top-4 right-4 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-full p-2 shadow-lg">
                                                                    <CheckCircle2 size={18} />
                                                                </div>
                                                                <div className="absolute inset-0 bg-gradient-to-t from-teal-900/30 to-transparent"></div>
                                                            </>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex-1 p-6 flex flex-col">
                                                        <div className="flex-1">
                                                            <h4 className="text-xl font-bold text-gray-800 mb-3">
                                                                {course.title}
                                                            </h4>
                                                            <p className="text-gray-600 mb-6 leading-relaxed">
                                                                {course.description}
                                                            </p>
                                                        </div>
                                                        
                                                        <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                                                            <button 
                                                                onClick={() => handleToggleComplete(course.id, isCompleted)} 
                                                                className={`flex-1 inline-flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-xl transition-all duration-300 ${
                                                                    isCompleted 
                                                                        ? 'bg-gradient-to-r from-teal-100 to-blue-100 text-teal-700 hover:from-teal-200 hover:to-blue-200' 
                                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                }`}
                                                            >
                                                                {isCompleted ? 
                                                                    <><CheckCircle2 size={18} /> Completado</> : 
                                                                    <><Bookmark size={18} /> Marcar Completado</>
                                                                }
                                                            </button>
                                                            
                                                            <button 
                                                                onClick={() => handleViewContent(course.id)} 
                                                                className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:from-teal-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                                                            >
                                                                <BookOpen size={20} /> 
                                                                Ver Contenido
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Estado vacío mejorado
                    <div className="text-center py-20">
                        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
                            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="h-12 w-12 text-gray-400" />
                            </div>
                            
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">
                                No se encontraron cursos
                            </h3>
                            
                            <p className="text-gray-600 mb-8 leading-relaxed">
                                {searchTerm || selectedCategory 
                                    ? 'Intenta ajustar tu búsqueda o filtro de categoría para encontrar más cursos.'
                                    : 'Aún no hay cursos disponibles en el catálogo.'
                                }
                            </p>

                            {(searchTerm || selectedCategory) && (
                                <div className="space-y-3">
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setSelectedCategory('');
                                        }}
                                        className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:from-teal-600 hover:to-blue-700 transition-all duration-300"
                                    >
                                        Limpiar Filtros
                                    </button>
                                    
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {searchTerm && (
                                            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                                                Búsqueda: "{searchTerm}"
                                                <button 
                                                    onClick={() => setSearchTerm('')}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    ✕
                                                </button>
                                            </span>
                                        )}
                                        {selectedCategory && (
                                            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                                                Categoría: {categories.find(cat => cat.id === selectedCategory)?.name}
                                                <button 
                                                    onClick={() => setSelectedCategory('')}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    ✕
                                                </button>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer con estadísticas adicionales */}
                {Object.keys(groupedCourses).length > 0 && (
                    <div className="mt-16 bg-white rounded-2xl shadow-xl p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            <div className="space-y-2">
                                <div className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                                    {filteredCourses.length}
                                </div>
                                <p className="text-gray-600 font-semibold">Cursos Disponibles</p>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                                    {completedCourses.filter(id => filteredCourses.some(course => course.id === id)).length}
                                </div>
                                <p className="text-gray-600 font-semibold">Cursos Completados</p>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {Math.round((completedCourses.filter(id => filteredCourses.some(course => course.id === id)).length / filteredCourses.length) * 100) || 0}%
                                </div>
                                <p className="text-gray-600 font-semibold">Progreso General</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}