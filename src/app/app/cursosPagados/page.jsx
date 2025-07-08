// src/app/app/courses/cursosPagados/page.jsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function CursosPagadosPage() {
  const { user, refreshUserData } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const [paidCoursesDetails, setPaidCoursesDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  // console.log('[CursosPagadosPage] Component rendered. User from context:', user);

  const fetchPaidCoursesDetails = useCallback(async () => {
    // console.log('[fetchPaidCoursesDetails] Attempting to fetch. User:', user);
    if (!user || !user.uid) {
      // console.log('[fetchPaidCoursesDetails] No user or user.uid. Clearing details and stopping loading.');
      setPaidCoursesDetails([]);
      setLoading(false);
      return;
    }
    if (!user.cursosPagados || user.cursosPagados.length === 0) {
      // console.log('[fetchPaidCoursesDetails] user.cursosPagados is missing or empty. Clearing details. user.cursosPagados:', user.cursosPagados);
      setPaidCoursesDetails([]);
      setLoading(false);
      return;
    }

    // console.log('[fetchPaidCoursesDetails] User has paid courses, proceeding. user.cursosPagados:', user.cursosPagados);
    setLoading(true);
    try {
      const coursePromises = user.cursosPagados.map(async (paidCourse) => {
        // console.log('[fetchPaidCoursesDetails] Processing paidCourse:', paidCourse);
        if (!paidCourse.idCurso) {
            console.error('[fetchPaidCoursesDetails] paidCourse is missing idCurso:', paidCourse);
            return null;
        }
        const courseDocRef = doc(db, 'courses', paidCourse.idCurso);
        const courseDocSnap = await getDoc(courseDocRef);
        if (courseDocSnap.exists()) {
          // console.log(`[fetchPaidCoursesDetails] Found course details for ${paidCourse.idCurso}:`, courseDocSnap.data());
          return { 
            ...courseDocSnap.data(),
            id: courseDocSnap.id, // ID del documento del curso en la colección 'courses'
            idCurso: paidCourse.idCurso, // ID del curso como está en user.cursosPagados
            fechaExamen: paidCourse.fechaExamen,
            nota: paidCourse.nota
          };
        } else {
          console.warn(`[fetchPaidCoursesDetails] Course document not found for idCurso: ${paidCourse.idCurso}`);
          return null;
        }
      });

      const coursesData = (await Promise.all(coursePromises)).filter(Boolean);
      // console.log('[fetchPaidCoursesDetails] Fetched and filtered coursesData:', coursesData);
      setPaidCoursesDetails(coursesData);
    } catch (error) {
      console.error("[fetchPaidCoursesDetails] Error fetching paid courses details:", error);
      Swal.fire('Error', 'No se pudieron cargar los detalles de tus cursos.', 'error');
    } finally {
      // console.log('[fetchPaidCoursesDetails] Finished fetching. Setting loading to false.');
      setLoading(false);
    }
  }, [user]); 

  useEffect(() => {
    // console.log('[useEffect] Running. User:', user);
    if (user) { // Solo intentar cargar si hay un usuario
      fetchPaidCoursesDetails();
    } else {
      // console.log('[useEffect] No user present, setting loading to false.');
      setLoading(false); // Si no hay usuario, no hay nada que cargar.
    }
  }, [user, fetchPaidCoursesDetails]);

  const handleExamInteraction = async (course) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const examDateStr = course.fechaExamen;
    let examDateObj = null;
    if (examDateStr) {
        const parts = examDateStr.split('-');
        // Asegurarse de que el mes se parsea correctamente (0-11)
        examDateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])); 
        examDateObj.setHours(0,0,0,0);
    }
    
    const examDatePassed = examDateObj && examDateObj < today;
    const needsNotaRegistration = examDatePassed && (course.nota === null || course.nota === undefined);

    if (needsNotaRegistration) {
      const { value: notaIngresada } = await Swal.fire({
        title: `Examen del curso: ${course.name}`,
        html: `La fecha de tu examen (<strong>${examDateStr}</strong>) ha pasado.<br/>Por favor, ingresa tu nota (0-100):`,
        input: 'number',
        inputAttributes: { min: 0, max: 100, step: 1 },
        showCancelButton: true,
        confirmButtonText: 'Guardar Nota',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
          const numValue = parseFloat(value);
          if (value === '' || value === null || isNaN(numValue) || numValue < 0 || numValue > 100) {
            return 'Por favor, ingresa una nota válida entre 0 y 100.';
          }
        }
      });

      if (notaIngresada !== undefined && notaIngresada !== null) {
        const notaObtenida = parseInt(notaIngresada);
        const userDocRef = doc(db, 'users', user.uid);
        
        const originalPaidCourseEntry = user.cursosPagados.find(
            p => p.idCurso === course.idCurso && p.fechaExamen === course.fechaExamen 
                 // Si puede haber múltiples entradas para el mismo curso con diferentes notas pero misma fecha (poco probable),
                 // podrías necesitar un identificador más único o refinar la lógica de búsqueda.
                 // Por ahora, idCurso y fechaExamen deberían ser suficientes para identificar la entrada.
        );

        if (!originalPaidCourseEntry) {
            console.error("Original paid course entry not found in user.cursosPagados. Course for interaction:", course, "Current user.cursosPagados:", user.cursosPagados);
            Swal.fire('Error', 'No se encontró la entrada del curso pagado para actualizar. Por favor, recarga la página e intenta de nuevo.', 'error');
            return;
        }
        
        const entryToModify = { ...originalPaidCourseEntry }; // Copia para evitar mutación directa del estado

        if (notaObtenida >= 51) { 
          Swal.fire('¡Felicidades!', `Has aprobado el examen con ${notaObtenida}. El curso se marcará como completado.`, 'success');
          await updateDoc(userDocRef, {
            cursosPagados: arrayRemove(entryToModify) 
          });
        } else { 
          const { value: newExamDate } = await Swal.fire({
            title: 'Nota Insuficiente',
            html: `Tu nota fue <strong>${notaObtenida}</strong>. Debes volver a programar tu examen.`,
            input: 'date',
            inputLabel: 'Selecciona la nueva fecha para tu examen:',
            confirmButtonText: 'Guardar Nueva Fecha',
            showCancelButton: true,
            inputValidator: (value) => {
              if (!value) return 'Debes seleccionar una fecha.';
              const selectedDate = new Date(value + 'T00:00:00'); // Interpretar como local
              if (selectedDate <= today) return 'La fecha debe ser futura.';
            }
          });

          if (newExamDate) {
            const updatedCursosPagados = user.cursosPagados.map(pc =>
              (pc.idCurso === course.idCurso && pc.fechaExamen === entryToModify.fechaExamen) 
                ? { ...pc, fechaExamen: newExamDate, nota: notaObtenida } 
                : pc
            );
            await updateDoc(userDocRef, {
              cursosPagados: updatedCursosPagados
            });
            Swal.fire('Actualizado', 'Tu nueva fecha de examen ha sido guardada.', 'info');
          }
        }
        if (refreshUserData) {
            await refreshUserData(); // Esperar a que los datos del usuario se refresquen en el contexto
        } else {
            fetchPaidCoursesDetails(); // Fallback si refreshUserData no está disponible o no es async
        }
      }
    } else {
      // Si no se necesita registrar nota (needsNotaRegistration es false),
      // el usuario puede acceder al curso.
      if (examDateObj && examDateObj > today) { // Si la fecha del examen es futura
         Swal.fire('Información', `Tu examen para "${course.name}" es el ${examDateStr}. Podrás acceder al contenido.`, 'info');
      }
      // --- ESTA ES LA LÍNEA QUE REALIZA LA REDIRECCIÓN ---
      console.log(`Redirigiendo a /app/ContenidoCursos/${course.idCurso}`);
      router.push(`/app/courses/ContenidoCursos/${course.idCurso}`);
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <p className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Cargando tus cursos...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`flex flex-col justify-center items-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <p className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Por favor, inicia sesión para ver tus cursos.</p>
        <Link href="/auth/login" className={`${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'} hover:underline mt-2 transition-colors duration-200`}>
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  if (paidCoursesDetails.length === 0) {
    // console.log('[Render] No paid courses details to display. User:', user);
    return (
      <div className={`container mx-auto p-4 text-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
        <h1 className={`text-3xl font-bold mb-6 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Mis Cursos Premiun</h1>
        <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Aún no has adquirido ningún curso Premiun.</p>
        {/* Mensaje de depuración opcional: */}
        {/* {user && user.cursosPagados && user.cursosPagados.length > 0 && (
            <p className="text-sm text-orange-500 mt-2">(Debug: Tienes {user.cursosPagados.length} IDs de cursos en user.cursosPagados, pero no se pudieron cargar sus detalles. Revisa la consola para ver errores en fetchPaidCoursesDetails.)</p>
        )} */}
        <Link 
          href="/app/courses" 
          className={`${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} underline mt-4 inline-block text-lg transition-colors duration-200`}
        >
          Explorar cursos Premiun disponibles
        </Link>
      </div>
    );
  }

  return (
    <div className={`container mx-auto p-4 min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <h1 className={`text-3xl font-bold mb-8 text-center ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
        Mis Cursos Premiun Adquiridos
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {paidCoursesDetails.map(course => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          let examDateObj = null;
          if (course.fechaExamen) {
            const parts = course.fechaExamen.split('-');
            examDateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            examDateObj.setHours(0,0,0,0);
          }

          const examDatePassed = examDateObj && examDateObj < today;
          const needsNotaRegistration = examDatePassed && (course.nota === null || course.nota === undefined);
          const buttonText = needsNotaRegistration ? 'Registrar Nota Examen' : 'Acceder al Curso';

          // Usar una key única, por ejemplo, combinando idCurso y fechaExamen si pueden haber duplicados de idCurso con diferentes fechas
          const uniqueKey = `${course.idCurso}-${course.fechaExamen || 'no-exam-date'}`;

          return (
            <div 
              key={uniqueKey} 
              className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-xl rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-105 ${isDark ? 'hover:shadow-2xl hover:shadow-gray-900/50' : 'hover:shadow-2xl'} border`}
            >
              <img 
                src={course.image || `https://placehold.co/600x400/E0E0E0/757575?text=${encodeURIComponent(course.name || 'Curso')}`} 
                alt={`Portada de ${course.name || 'Curso'}`} 
                className="w-full h-56 object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/600x400/E0E0E0/757575?text=Error+Img"; }}
              />
              <div className="p-5 flex flex-col flex-grow">
                <h2 className={`text-2xl font-semibold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                  {course.name || 'Nombre del Curso no disponible'}
                </h2>
                
                {course.fechaExamen && (
                  <p className={`text-sm mb-1 ${needsNotaRegistration ? 'text-red-400 font-semibold animate-pulse' : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>
                    Fecha de Examen: {course.fechaExamen}
                    {needsNotaRegistration && " (¡Requiere tu atención!)"}
                  </p>
                )}
                {(course.nota !== null && course.nota !== undefined) && (
                   <p className={`text-sm mb-2 font-medium ${course.nota >= 51 ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-orange-400' : 'text-orange-600')}`}>
                     Última Nota Registrada: {course.nota} / 100
                   </p>
                )}
                
                <button
                  onClick={() => handleExamInteraction(course)}
                  className={`mt-auto w-full font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out text-white focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                    needsNotaRegistration 
                      ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400' 
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-400'
                  }`}
                >
                  {buttonText}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}