// Archivo: src/app/app/courses/page.jsx

'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, where, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Image from 'next/image';
import Swal from 'sweetalert2';

const NUMERO_WHATSAPP_MAJO = '+59171168130';
const NOMBRE_NEGOCIO_MAJO = 'DOCTEMIA MC';

export default function UserListCoursesPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [availableCourses, setAvailableCourses] = useState([]);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseForPurchase, setSelectedCourseForPurchase] = useState(null);
  const [examDate, setExamDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserPhone(userDoc.data().telefono || '');
        }

        const qrDocRef = doc(db, 'pags', 'qr');
        const qrDoc = await getDoc(qrDocRef);
        if (qrDoc.exists()) {
          setQrUrl(qrDoc.data().url);
        }

        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const allCourses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const activeCourses = allCourses.filter(course => course.isActive);

        const solicitudesSnapshot = await getDocs(
          query(collection(db, 'solicitudes'), where('userId', '==', user.uid))
        );
        const userSolicitudes = solicitudesSnapshot.docs.map(doc => doc.data());
        const pendingCourseIds = userSolicitudes.map(solicitud => solicitud.courseId);

        const filteredCourses = activeCourses.filter(
          course => !user.cursosPagados?.some(p => p.idCurso === course.id)
        );

        setPendingCourses(filteredCourses.filter(course => pendingCourseIds.includes(course.id)));
        setAvailableCourses(filteredCourses.filter(course => !pendingCourseIds.includes(course.id)));
      } catch (error) {
        console.error('Error loading courses or solicitudes:', error);
        Swal.fire('Error', 'No se pudieron cargar los cursos.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleOpenPurchaseModal = course => {
    setSelectedCourseForPurchase(course);
    setExamDate('');
  };

  const handleClosePurchaseModal = () => {
    setSelectedCourseForPurchase(null);
  };

  const handlePurchaseConfirmation = async () => {
    if (isSubmitting) return;
    if (!selectedCourseForPurchase || !examDate) {
      Swal.fire('Error', 'Por favor, selecciona una fecha para tu examen.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'solicitudes'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        userPhone,
        courseId: selectedCourseForPurchase.id,
        courseName: selectedCourseForPurchase.name,
        paymentDate: serverTimestamp(),
        examDate,
        status: 'pendiente',
      });

      Swal.fire(
        '¡Solicitud Enviada!',
        `Tu solicitud para el curso "${selectedCourseForPurchase.name}" ha sido registrada.`,
        'success'
      );

      setPendingCourses(prev => [...prev, selectedCourseForPurchase]);
      setAvailableCourses(prev => prev.filter(c => c.id !== selectedCourseForPurchase.id));

      const mensaje = `Hola ${NOMBRE_NEGOCIO_MAJO}, soy ${user.displayName} (${user.email}). He pagado por el curso: "${selectedCourseForPurchase.name}".`;
      window.open(
        `https://api.whatsapp.com/send?phone=${NUMERO_WHATSAPP_MAJO}&text=${encodeURIComponent(mensaje)}`,
        '_blank'
      );
      handleClosePurchaseModal();
    } catch (error) {
      console.error('Error creating solicitud:', error);
      Swal.fire('Error', 'No se pudo procesar tu solicitud.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePendingClick = course => {
    const mensaje = `Mi solicitud al curso "${course.name}" está tardando mucho.`;
    Swal.fire({
      title: '¿Tu solicitud está tardando mucho?',
      html: `<a href="https://api.whatsapp.com/send?phone=${NUMERO_WHATSAPP_MAJO}&text=${encodeURIComponent(
        mensaje
      )}" target="_blank" class="underline">Contactar por WhatsApp</a>`,
      icon: 'info',
    });
  };

  if (loading) {
    return (
      <div
        className={`flex justify-center items-center h-screen ${
          isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
        }`}
      >
        Cargando cursos...
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className={`flex justify-center items-center h-screen ${
          isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
        }`}
      >
        Por favor, inicia sesión para ver los cursos.
      </div>
    );
  }

  return (
    <div className={`container mx-auto p-4 ${isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}> 
      <h1 className={`text-3xl font-bold mb-6 text-center ${
        isDark ? 'text-gray-100' : 'text-gray-900'
      }`}>Cursos Disponibles</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...pendingCourses, ...availableCourses].map(course => (
          <div
            key={course.id}
            className={`flex flex-col shadow-lg rounded-lg overflow-hidden ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <img
              src={course.image || '/placeholder-image.jpg'}
              alt={course.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4 flex flex-col flex-grow">
              <h2 className={`${
                isDark ? 'text-gray-100' : 'text-gray-900'
              } text-xl font-semibold mb-2`}>{course.name}</h2>
              <p className={`${
                isDark ? 'text-gray-300' : 'text-gray-700'
              } mb-1 text-sm flex-grow`}>{course.description.substring(0, 100)}...</p>
              <p className={`${
                isDark ? 'text-blue-400' : 'text-blue-600'
              } text-lg font-bold mb-3`}>Bs {course.price.toFixed(2)}</p>
              {pendingCourses.some(p => p.id === course.id) ? (
                <button
                  onClick={() => handlePendingClick(course)}
                  className={`mt-auto w-full font-bold py-2 px-4 rounded transition duration-300 ${
                    isDark ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                  }`}
                >
                  Pendiente
                </button>
              ) : (
                <button
                  onClick={() => handleOpenPurchaseModal(course)}
                  className={`mt-auto w-full font-bold py-2 px-4 rounded transition duration-300 ${
                    isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-700 text-white'
                  }`}
                >
                  Comprar Curso
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedCourseForPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div
            className={`p-6 rounded-lg shadow-xl w-full max-w-md ${
              isDark ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-900'
            }`}
          >
            <h2 className={`text-2xl font-bold mb-4 ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}>Confirmar Compra: {selectedCourseForPurchase.name}</h2>
            <p className={`${
              isDark ? 'text-gray-100' : 'text-gray-900'
            } mb-2`}>Precio: Bs {selectedCourseForPurchase.price.toFixed(2)}</p>
            <div className="mb-4 text-center">
              <p className={`font-semibold mb-2 ${
                isDark ? 'text-gray-100' : 'text-gray-900'
              }`}>1. Realiza el pago escaneando el siguiente QR:</p>
              <div className="flex justify-center my-2">
                {qrUrl ? (
                  <Image
                    src={qrUrl}
                    alt="Código QR para pago"
                    width={200}
                    height={200}
                  />
                ) : (
                  <p className={`${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  } text-sm`}>Cargando QR...</p>
                )}
              </div>
              <p className={`text-sm mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                O realiza una transferencia a la cuenta de {NOMBRE_NEGOCIO_MAJO}.
              </p>
              <p className={`font-semibold mb-2 ${
                isDark ? 'text-gray-100' : 'text-gray-900'
              }`}>2. Envía el comprobante de pago a nuestro WhatsApp:</p>
              <a
                href={`https://wa.me/${NUMERO_WHATSAPP_MAJO}?text=${encodeURIComponent(
                  `Hola ${NOMBRE_NEGOCIO_MAJO}, quiero enviar mi comprobante para el curso "${selectedCourseForPurchase.name}".`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-bold my-1 inline-block ${
                  isDark ? 'text-green-400 hover:text-green-300' : 'text-green-500 hover:text-green-700'
                }`}
              >
                Contactar por WhatsApp ({NUMERO_WHATSAPP_MAJO})
              </a>
            </div>

            <div className="mb-4">
              <label
                htmlFor="examDate"
                className={`block text-sm mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                3. Ingresa la fecha de tu examen:
              </label>
              <input
                type="date"
                id="examDate"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`mt-1 block w-full px-3 py-2 rounded-md shadow-sm ${
                  isDark ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleClosePurchaseModal}
                className={`font-bold py-2 px-4 rounded ${
                  isDark
                    ? 'bg-gray-600 hover:bg-gray-500 text-gray-100'
                    : 'bg-gray-300:hover:bg-gray-400 text-gray-800'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handlePurchaseConfirmation}
                disabled={!examDate || isSubmitting}
                className={`font-bold py-2 px-4 rounded ${
                  !examDate || isSubmitting
                    ? isDark
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-300 cursor-not-allowed'
                    : isDark
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-700 text-white'
                }`}
              >
                Hecho, Enviar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
