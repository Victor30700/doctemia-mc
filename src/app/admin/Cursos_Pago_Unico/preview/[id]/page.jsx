'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ReactPlayer from 'react-player/lazy';
import { useTheme } from '@/context/ThemeContext';
import { ArrowLeftIcon, LinkIcon, VideoIcon } from 'lucide-react';

export default function PreviewSinglePaymentCourse() {
  const { id: courseId } = useParams();
  const router = useRouter();
  const { isDark, isLoaded } = useTheme();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState('');
  const [selectedVideoTitle, setSelectedVideoTitle] = useState('');

  useEffect(() => {
    if (!courseId) {
        setLoading(false);
        return;
    }
    const fetchCourse = async () => {
      try {
        const docRef = doc(db, 'Cursos_Pago_Unico', courseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const courseData = docSnap.data();
          setCourse(courseData);
          if (courseData.modules?.[0]?.videos?.[0]) {
            setSelectedVideoUrl(courseData.modules[0].videos[0].url);
            setSelectedVideoTitle(courseData.modules[0].videos[0].title);
          }
        }
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

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
            </div>
            <div className="lg:w-1/3 space-y-3">
              <div className={`h-20 w-full rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
              <div className={`h-20 w-full rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
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
            Volver
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            <div className="aspect-video w-full mb-4 bg-black rounded-xl overflow-hidden shadow-2xl">
              {selectedVideoUrl ? (
                <ReactPlayer url={selectedVideoUrl} width='100%' height='100%' controls={true} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                  <p className="text-gray-500">Este curso no tiene videos o no se pudo cargar el reproductor.</p>
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
            <p className={`text-lg mb-4 font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{selectedVideoTitle}</p>
            <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{course.description}</p>
            
            {course.summaryDriveLink && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <a href={course.summaryDriveLink} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
                  <LinkIcon className="h-4 w-4" />
                  Resumen del Curso (Drive)
                </a>
              </div>
            )}
          </div>

          <div className={`lg:w-1/3 p-4 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">Contenido del Curso</h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {course.modules?.map((module, moduleIndex) => (
                <div key={moduleIndex}>
                    <h3 className={`font-bold text-lg mb-2 p-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>{module.title}</h3>
                    <div className="space-y-2">
                        {module.videos?.map((video, videoIndex) => (
                            <button
                                key={videoIndex}
                                onClick={() => {
                                    setSelectedVideoUrl(video.url);
                                    setSelectedVideoTitle(video.title);
                                }}
                                className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-all duration-200 ${selectedVideoUrl === video.url ? (isDark ? 'bg-blue-900/50' : 'bg-blue-100') : (isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}`}
                            >
                                <VideoIcon className={`h-5 w-5 mt-1 flex-shrink-0 ${selectedVideoUrl === video.url ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-gray-500' : 'text-gray-400')}`} />
                                <div>
                                    <p className={`font-semibold leading-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{video.title}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
