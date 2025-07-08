// src/app/app/coursesPagoUnico/ContenidoCursos/[courseId]/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Swal from 'sweetalert2';
import ProtectedVideoPlayer from '@/app/components/video/ProtectedVideoPlayer';
import { FileText, Video, ChevronDown } from 'lucide-react';

export default function ContenidoCursoPagoUnicoPage() {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const router = useRouter();
    const params = useParams();
    const courseId = params.courseId;

    const [courseDetails, setCourseDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [openModuleIndex, setOpenModuleIndex] = useState(0);
    // --- ✅ CORRECCIÓN: Se añade el estado para el progreso del video ---
    const [videoProgress, setVideoProgress] = useState({});

    // --- Medida de Seguridad 1: Deshabilitar inspección de elementos ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.keyCode === 123 || (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 67)) || (e.ctrlKey && e.keyCode === 85)) {
                e.preventDefault();
                showSecurityWarning();
                return false;
            }
        };
        const handleContextMenu = (e) => { e.preventDefault(); showSecurityWarning(); return false; };
        const showSecurityWarning = () => {
            Swal.fire({
                title: 'Contenido Protegido',
                text: 'Las funciones de inspección, copia y descarga están deshabilitadas.',
                icon: 'warning',
                timer: 3000,
                showConfirmButton: false,
                background: isDark ? '#1f2937' : '#ffffff',
                color: isDark ? '#f9fafb' : '#111827',
            });
        };
        const detectDevTools = () => {
            const threshold = 160;
            if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
                showSecurityWarning();
                console.clear();
                console.log('%cContenido Protegido', 'color: red; font-size: 16px; font-weight: bold;');
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('contextmenu', handleContextMenu);
        const devToolsInterval = setInterval(detectDevTools, 1000);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('contextmenu', handleContextMenu);
            clearInterval(devToolsInterval);
        };
    }, [isDark]);

    // --- ✅ CORRECCIÓN: Medida de Seguridad 2: Deshabilitar selección de texto ---
    useEffect(() => {
        const disableSelection = (e) => { e.preventDefault(); return false; };
        const disableDrag = (e) => { e.preventDefault(); return false; };
        document.addEventListener('selectstart', disableSelection);
        document.addEventListener('dragstart', disableDrag);
        return () => {
            document.removeEventListener('selectstart', disableSelection);
            document.removeEventListener('dragstart', disableDrag);
        };
    }, []);

    // --- Lógica principal para cargar datos y verificar acceso ---
    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (user && !user.hasPagoUnicoAccess) {
            Swal.fire({ title: 'Acceso Denegado', text: 'No tienes permiso para acceder a esta sección.', icon: 'error', background: isDark ? '#1f2937' : '#ffffff', color: isDark ? '#f9fafb' : '#111827' });
            router.push('/app/coursesPagoUnico');
            return;
        }

        if (courseId) {
            const fetchCourseDetails = async () => {
                setLoading(true);
                setError(null);
                try {
                    const courseDocRef = doc(db, 'Cursos_Pago_Unico', courseId);
                    const courseDocSnap = await getDoc(courseDocRef);

                    if (courseDocSnap.exists()) {
                        const courseData = { id: courseDocSnap.id, ...courseDocSnap.data() };
                        setCourseDetails(courseData);
                        if (courseData.modules && courseData.modules[0]?.videos && courseData.modules[0].videos[0]) {
                            setSelectedVideo(courseData.modules[0].videos[0]);
                        }
                    } else {
                        setError('Curso no encontrado.');
                    }
                } catch (err) {
                    console.error("Error fetching course content:", err);
                    setError('Error al cargar el contenido del curso.');
                } finally {
                    setLoading(false);
                }
            };
            fetchCourseDetails();
        } else {
            setLoading(false);
            setError('ID de curso no proporcionado.');
        }
    }, [courseId, user, router, isDark]);

    // --- ✅ CORRECCIÓN: Se añade la función para manejar el progreso del video ---
    const handleVideoProgress = (state) => {
        if (selectedVideo) {
            setVideoProgress(prev => ({
                ...prev,
                [selectedVideo.url]: { played: state.played }
            }));
        }
    };

    if (loading) return <div className={`flex justify-center items-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}><p>Cargando...</p></div>;
    if (error) return <div className={`flex justify-center items-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}><p className="text-red-500">{error}</p></div>;
    if (!courseDetails) return <div className={`flex justify-center items-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}><p>No se encontraron detalles.</p></div>;

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
            <header className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md sticky top-0 z-20`}>
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <button onClick={() => router.push('/app/coursesPagoUnico')} className={`font-medium flex items-center transition ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}>
                        &larr; Volver al Catálogo
                    </button>
                    <h1 className="text-xl md:text-2xl font-bold text-center flex-grow px-4 truncate">{courseDetails.title}</h1>
                    <div className="w-8 invisible" />
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="lg:w-3/4">
                        <div className="w-full h-auto aspect-video bg-black rounded-lg shadow-lg overflow-hidden mb-4">
                            {selectedVideo ? (
                                <ProtectedVideoPlayer url={selectedVideo.url} onProgress={handleVideoProgress} width="100%" height="100%" />
                            ) : (
                                <div className={`flex justify-center items-center h-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}><p>Selecciona un video.</p></div>
                            )}
                        </div>
                        <div className={`p-6 rounded-lg shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                            <h3 className="text-xl font-semibold mb-3">Descripción del Curso</h3>
                            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} whitespace-pre-line`}>{courseDetails.description || 'No hay descripción.'}</p>
                            {courseDetails.summaryDriveLink && (
                                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <h4 className="text-lg font-semibold mb-3">Recursos Adicionales</h4>
                                    <a href={courseDetails.summaryDriveLink} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
                                        <FileText className="h-4 w-4" /> Resumen del Curso (Drive)
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:w-1/4">
                        <div className={`p-4 rounded-lg shadow-md max-h-[calc(100vh-10rem)] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                            <h3 className={`text-lg font-semibold mb-4 pb-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>Contenido</h3>
                            <div className="space-y-2">
                                {courseDetails.modules?.map((module, moduleIdx) => (
                                    <div key={moduleIdx} className={`rounded-lg border overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                        <button onClick={() => setOpenModuleIndex(openModuleIndex === moduleIdx ? -1 : moduleIdx)} className={`w-full flex justify-between items-center p-3 text-left font-semibold ${isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                            <span>{module.title || `Módulo ${moduleIdx + 1}`}</span>
                                            <ChevronDown className={`transition-transform ${openModuleIndex === moduleIdx ? 'rotate-180' : ''}`} />
                                        </button>
                                        {openModuleIndex === moduleIdx && (
                                            <ul className={`p-2 space-y-1 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                                                {module.videos?.map((video, videoIdx) => {
                                                    const isSelected = selectedVideo?.url === video.url;
                                                    const progress = videoProgress[video.url]?.played || 0;
                                                    return (
                                                        <li key={videoIdx}>
                                                            <button onClick={() => setSelectedVideo(video)} className={`w-full text-left p-2.5 rounded-md transition-colors flex items-center gap-3 relative overflow-hidden ${isSelected ? (isDark ? 'bg-blue-900/50' : 'bg-blue-100') : (isDark ? 'hover:bg-gray-700/60' : 'hover:bg-gray-200/70')}`}>
                                                                <div className={`absolute left-0 top-0 h-full opacity-30 ${isDark ? 'bg-green-800' : 'bg-green-200'}`} style={{ width: `${progress * 100}%` }} />
                                                                <Video size={18} className={`relative ${isSelected ? (isDark ? 'text-blue-300' : 'text-blue-600') : (isDark ? 'text-gray-400' : 'text-gray-500')}`} />
                                                                <div className="relative flex flex-col">
                                                                    <span className={`text-sm ${isSelected ? (isDark ? 'text-blue-200' : 'text-blue-800') : ''}`}>{video.title || `Video ${videoIdx + 1}`}</span>
                                                                    {progress > 0 && <span className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>{Math.round(progress * 100)}% visto</span>}
                                                                </div>
                                                            </button>
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
