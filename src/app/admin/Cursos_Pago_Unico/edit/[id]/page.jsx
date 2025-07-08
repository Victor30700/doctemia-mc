'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
// --- CORRECCIÓN DE LA RUTA DE IMPORTACIÓN ---
// La ruta correcta es dos niveles hacia arriba (../..) para llegar a la carpeta Cursos_Pago_Unico
import CourseForm from '../../CourseForm'; 
import { useTheme } from '@/context/ThemeContext';
import { Loader, AlertTriangle } from 'lucide-react';

// --- Componentes de UI para una mejor experiencia de usuario ---

const LoadingSpinner = () => {
  const { isDark } = useTheme();
  return (
    <div className={`flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Loader className="animate-spin text-indigo-500 h-12 w-12" />
      <p className={`mt-4 text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
        Cargando datos del curso...
      </p>
    </div>
  );
};

const ErrorMessage = ({ message }) => {
    const { isDark } = useTheme();
    return (
      <div className={`flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`p-6 border-l-4 rounded-r-lg shadow-md ${isDark ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-400'}`}>
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <p className={`text-lg font-bold ${isDark ? 'text-red-400' : 'text-red-700'}`}>{message}</p>
                </div>
            </div>
        </div>
      </div>
    );
};


// --- Componente Principal de la Página de Edición ---

export default function EditCoursePage() {
  const { id: courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      setError('No se ha especificado un ID de curso para editar.');
      return;
    }

    const fetchCourse = async () => {
      try {
        const docRef = doc(db, 'Cursos_Pago_Unico', courseId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCourse(docSnap.data());
        } else {
          setError('No se encontró ningún curso con el ID proporcionado.');
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Ocurrió un error al intentar cargar los datos del curso.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!course) {
    return <ErrorMessage message="No se pudieron cargar los datos del curso para editar." />;
  }

  return (
    <CourseForm course={course} courseId={courseId} />
  );
}
