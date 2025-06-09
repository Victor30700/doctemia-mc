// Archivo: src/app/admin/solicitudes/page.jsx

'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Swal from 'sweetalert2';

export default function AdminSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState([]);

  useEffect(() => {
    const fetchSolicitudes = async () => {
      const snapshot = await getDocs(collection(db, 'solicitudes'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSolicitudes(data);
    };

    fetchSolicitudes();
  }, []);

  const handleRecibirPago = async (solicitud) => {
    const confirm = await Swal.fire({
      title: '¿Recibiste el pago?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar',
    });

    if (confirm.isConfirmed) {
      const userRef = doc(db, 'users', solicitud.userId);
      await updateDoc(userRef, {
        cursosPagados: arrayUnion({
          idCurso: solicitud.courseId,
          fechaExamen: solicitud.examDate,
          nota: null,
        }),
      });
      await deleteDoc(doc(db, 'solicitudes', solicitud.id));
      setSolicitudes(solicitudes.filter(s => s.id !== solicitud.id));
      Swal.fire('Listo', 'El curso ha sido asignado al usuario.', 'success');
    }
  };

  const handleNoPago = async (solicitud) => {
    const result = await Swal.fire({
      title: '¿Qué quieres hacer?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Borrar solicitud',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      await deleteDoc(doc(db, 'solicitudes', solicitud.id));
      setSolicitudes(solicitudes.filter(s => s.id !== solicitud.id));
      Swal.fire('Eliminado', 'La solicitud ha sido eliminada.', 'success');
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Solicitudes Pendientes</h1>
      <div className="grid grid-cols-1 gap-4">
        {solicitudes.length === 0 && <p>No hay solicitudes pendientes.</p>}

        {solicitudes.map(solicitud => (
          <div key={solicitud.id} className="bg-white p-4 rounded shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p><strong>Usuario:</strong> {solicitud.userName}</p>
              <p><strong>Correo:</strong> {solicitud.userEmail}</p>
              <p><strong>Curso:</strong> {solicitud.courseName}</p>
              <p><strong>Fecha de Examen:</strong> {solicitud.examDate}</p>
              <p><strong>Estado:</strong> {solicitud.status}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <a
                href={`https://api.whatsapp.com/send?phone=591${solicitud.userPhone || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center"
              >
                📱 WhatsApp
              </a>
              <button onClick={() => handleRecibirPago(solicitud)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Recibí el pago</button>
              <button onClick={() => handleNoPago(solicitud)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">No se realizó el pago</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
