//src/app/admin/courses/preview/[id]/page.jsx
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import ReactPlayer from 'react-player/lazy';
import { useTheme } from '@/context/ThemeContext';

// --- Iconos SVG para un look profesional ---
const ArrowLeftIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
  </svg>
);
const LinkIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/>
    </svg>
);
const VideoIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
    </svg>
);


export default function PreviewCourse() {
  const { id: courseId } = useParams();
  const router = useRouter();
  const { isDark, isLoaded } = useTheme();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      if (courseId) {
        try {
          const docRef = doc(db, 'courses', courseId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const courseData = docSnap.data();
            // Ordenar videos por el campo 'order'
            courseData.videos.sort((a, b) => a.order - b.order);
            setCourse(courseData);
            // Seleccionar el primer video por defecto
            if (courseData.videos && courseData.videos.length > 0) {
              setSelectedVideo(courseData.videos[0]);
            }
          }
        } catch (error) {
          console.error('Error fetching course:', error);
        }
      }
      setLoading(false);
    };
    fetchCourse();
  }, [courseId]);

  // Skeleton Loader para una carga más profesional
  if (!isLoaded || loading) {
    return (
        <div className={`min-h-screen p-4 sm:p-8 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className="animate-pulse">
                <div className={`h-8 w-48 rounded mb-6 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="lg:w-2/3">
                        <div className={`aspect-video w-full rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                        <div className={`h-8 w-3/4 rounded mt-4 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                        <div className={`h-4 w-full rounded mt-2 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                        <div className={`h-4 w-5/6 rounded mt-2 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                    </div>
                    <div className="lg:w-1/3 space-y-3">
                        {[...Array(4)].map((_, i) => (
                             <div key={i} className={`h-20 w-full rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
  }

  if (!course) {
    return <div className={`min-h-screen p-8 text-center text-lg ${isDark ? 'text-red-400' : 'text-red-600'}`}>El curso no existe o hubo un error al cargarlo.</div>;
  }

  return (
    <section className={`min-h-screen p-4 sm:p-8 transition-colors duration-300 ${isDark ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button onClick={() => router.back()} className={`flex items-center gap-2 text-sm font-semibold transition ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
            <ArrowLeftIcon className="h-5 w-5" />
            Volver a Cursos
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Columna principal del video y detalles */}
          <div className="lg:w-2/3">
            <div className="aspect-video w-full mb-4 bg-black rounded-xl overflow-hidden shadow-2xl">
              {selectedVideo ? (
                <ReactPlayer
                  url={selectedVideo.url}
                  width='100%'
                  height='100%'
                  controls={true}
                  // Se elimina la propiedad 'playing={true}' para evitar conflictos con 'light'.
                  light={true} 
                  config={{
                    youtube: { playerVars: { disablekb: 1, modestbranding: 1, rel: 0 } }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                    <p className="text-gray-500">Selecciona un video de la lista</p>
                </div>
              )}
            </div>
            
            <h1 className="text-3xl font-bold mb-2">{course.name}</h1>
            <p className={`text-lg mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{selectedVideo?.description || course.description}</p>
            
            <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    Bs {course.price.toFixed(2)}
                </p>
                {course.summaryDriveLink && (
                    <a 
                        href={course.summaryDriveLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                    >
                        <LinkIcon className="h-4 w-4" />
                        Resumen del Curso
                    </a>
                )}
            </div>
          </div>

          {/* Columna de la lista de reproducción */}
          <div className={`lg:w-1/3 p-4 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">Contenido del Curso</h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {course.videos.map((video, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedVideo(video)}
                  className={`w-full text-left p-3 rounded-lg flex items-start gap-4 transition-all duration-200 ${selectedVideo?.url === video.url ? (isDark ? 'bg-blue-900/50' : 'bg-blue-100') : (isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}`}
                >
                    <VideoIcon className={`h-6 w-6 mt-1 flex-shrink-0 ${selectedVideo?.url === video.url ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-gray-500' : 'text-gray-400')}`} />
                    <div>
                        <p className={`font-semibold leading-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{video.description}</p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Video {video.order}</p>
                    </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
