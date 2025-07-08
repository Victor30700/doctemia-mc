'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Swal from 'sweetalert2';
import { useTheme } from '@/context/ThemeContext';
import { Check, X, User, Mail, Calendar, Phone, MessageSquare } from 'lucide-react';

export default function AdminAccessRequestsPage() {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isDark } = useTheme();

    const swalTheme = {
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : '#111827',
    };

    useEffect(() => {
        const solicitudesRef = collection(db, 'pagoUnico_solicitudes');
        const unsubscribe = onSnapshot(solicitudesRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Ordenar para mostrar las más recientes primero
            data.sort((a, b) => (b.requestDate?.toDate() || 0) - (a.requestDate?.toDate() || 0));
            setSolicitudes(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleApprove = async (solicitud) => {
        const whatsappLink = solicitud.userPhone ? `https://api.whatsapp.com/send?phone=${solicitud.userPhone}&text=${encodeURIComponent(`Hola ${solicitud.userName}, te contacto desde DOCTEMIA MC para confirmar tu acceso.`)}` : null;

        Swal.fire({
            title: `¿Aprobar a ${solicitud.userName}?`,
            html: `
                <div class="text-left space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}">
                    <p>Estás a punto de conceder acceso a todos los cursos de pago único a este usuario.</p>
                    <p><strong>Usuario:</strong> ${solicitud.userName}</p>
                    <p><strong>Email:</strong> ${solicitud.userEmail}</p>
                    ${solicitud.userPhone ? `<p><strong>Teléfono:</strong> ${solicitud.userPhone}</p>` : ''}
                    <p class="mt-4 font-semibold">¿Has verificado el pago correspondiente?</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, aprobar acceso',
            cancelButtonText: 'Cancelar',
            showDenyButton: whatsappLink ? true : false,
            denyButtonText: '<span class="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>Contactar</span>',
            confirmButtonColor: '#22c55e', // green-500
            denyButtonColor: '#3b82f6', // blue-500
            ...swalTheme,
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const userRef = doc(db, 'users', solicitud.userId);
                    await updateDoc(userRef, { hasPagoUnicoAccess: true });
                    await deleteDoc(doc(db, 'pagoUnico_solicitudes', solicitud.id));
                    Swal.fire({ title: '¡Aprobado!', text: `${solicitud.userName} ahora tiene acceso.`, icon: 'success', ...swalTheme });
                } catch (error) {
                    console.error("Error approving access:", error);
                    Swal.fire({ title: 'Error', text: 'No se pudo completar la operación.', icon: 'error', ...swalTheme });
                }
            } else if (result.isDenied) {
                window.open(whatsappLink, '_blank');
            }
        });
    };

    const handleReject = async (solicitud) => {
        Swal.fire({
            title: '¿Rechazar Solicitud?',
            text: `Esta acción eliminará la solicitud de ${solicitud.userName} permanentemente.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, rechazar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444', // red-500
            ...swalTheme,
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteDoc(doc(db, 'pagoUnico_solicitudes', solicitud.id));
                    Swal.fire({ title: 'Rechazada', text: 'La solicitud ha sido eliminada.', icon: 'success', ...swalTheme });
                } catch (error) {
                    console.error("Error rejecting request:", error);
                    Swal.fire({ title: 'Error', text: 'No se pudo eliminar la solicitud.', icon: 'error', ...swalTheme });
                }
            }
        });
    };

    if (loading) {
        return <div className={`p-8 text-center ${isDark ? 'text-white' : 'text-black'}`}>Cargando solicitudes...</div>;
    }

    return (
        <div className={`p-4 md:p-6 min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className="max-w-7xl mx-auto">
                <h1 className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Solicitudes de Acceso (Pago Único)</h1>
                {solicitudes.length === 0 ? (
                    <div className={`text-center py-16 px-6 rounded-lg border-2 border-dashed ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
                         <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>¡Todo al día!</h3>
                         <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2`}>No hay solicitudes pendientes en este momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {solicitudes.map(solicitud => (
                            <div key={solicitud.id} className={`p-5 rounded-lg shadow-md flex flex-col gap-4 border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
                                <div className="space-y-3 flex-grow">
                                    <p className="flex items-center gap-3"><User size={18} className="text-indigo-400" /><strong className="text-lg">{solicitud.userName}</strong></p>
                                    <p className="flex items-center gap-3"><Mail size={16} className="text-gray-400" /><span className="truncate text-sm">{solicitud.userEmail}</span></p>
                                    {solicitud.userPhone && (
                                        <p className="flex items-center gap-3"><Phone size={16} className="text-gray-400" /><span className="text-sm">{solicitud.userPhone}</span></p>
                                    )}
                                    <p className="flex items-center gap-3 text-xs text-gray-500"><Calendar size={14} />{new Date(solicitud.requestDate?.toDate()).toLocaleString()}</p>
                                </div>
                                <div className="flex justify-end items-center gap-2 pt-3 border-t" style={{borderColor: isDark ? '#374151' : '#e5e7eb'}}>
                                    {solicitud.userPhone && (
                                        <a href={`https://api.whatsapp.com/send?phone=${solicitud.userPhone}`} target="_blank" rel="noopener noreferrer" className="p-2 text-green-500 hover:bg-green-500/10 rounded-full transition-colors">
                                           <MessageSquare size={20} />
                                        </a>
                                    )}
                                    <button onClick={() => handleReject(solicitud)} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors">
                                        <X size={16} />
                                    </button>
                                    <button onClick={() => handleApprove(solicitud)} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors">
                                        <Check size={16} /> Aprobar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}