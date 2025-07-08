'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast, Toaster } from 'react-hot-toast';
import { useTheme } from '@/context/ThemeContext';
import { Upload, Phone } from 'lucide-react';

export default function QRGestionPage() {
    const [qrUrl, setQrUrl] = useState('');
    const [adminPhone, setAdminPhone] = useState('');
    const [newQrLink, setNewQrLink] = useState('');
    const [newAdminPhone, setNewAdminPhone] = useState('');
    const [preview, setPreview] = useState('');
    const [loading, setLoading] = useState(true);
    const { isDark } = useTheme();

    const docRef = doc(db, 'pags', 'infoContacto');

    // Cargar datos iniciales
    useEffect(() => {
        const loadContactInfo = async () => {
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setQrUrl(data.qrUrl || '');
                    setAdminPhone(data.adminPhone || '');
                    setNewAdminPhone(data.adminPhone || ''); // Pre-rellenar el campo de input
                }
            } catch (error) {
                console.error("Error cargando la información de contacto:", error);
                toast.error('Error al cargar los datos.');
            } finally {
                setLoading(false);
            }
        };
        loadContactInfo();
    }, []);

    const handleLinkChange = (e) => {
        const value = e.target.value;
        setNewQrLink(value);
        if (value.startsWith('http')) {
            // Simple validación de URL, para previsualización
            setPreview(value);
        } else {
            setPreview('');
        }
    };

    const handleUpdateInfo = async () => {
        if (!newAdminPhone) {
            toast.error('El número de teléfono del administrador es obligatorio.');
            return;
        }
        if(!preview){
            toast.error('Por favor, proporciona un enlace válido para el nuevo QR.');
            return;
        }

        const toastId = toast.loading('Actualizando información...');

        try {
            const dataToUpdate = {
                qrUrl: newQrLink || qrUrl, // Usa el nuevo link si existe, si no, mantiene el anterior
                adminPhone: newAdminPhone
            };

            await setDoc(docRef, dataToUpdate, { merge: true });

            // Actualizar el estado local
            if (newQrLink) {
                setQrUrl(newQrLink);
            }
            setAdminPhone(newAdminPhone);

            toast.success('Información actualizada correctamente.', { id: toastId });
            setNewQrLink('');
            setPreview('');

        } catch (err) {
            console.error(err);
            toast.error('Error al actualizar la información.', { id: toastId });
        }
    };

    if (loading) {
        return <div className={`flex justify-center items-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}><p className={`animate-pulse ${isDark ? 'text-white' : 'text-black'}`}>Cargando...</p></div>;
    }

    return (
        <div className={`max-w-2xl mx-auto p-6 rounded-xl shadow-lg mt-10 border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
            <Toaster position="top-right" toastOptions={{
                className: isDark ? 'bg-gray-700 text-white' : '',
            }}/>
            <h1 className="text-3xl font-bold mb-6 text-indigo-500">Gestión de Contacto y Pagos</h1>

            {/* Gestión del Número de Teléfono */}
            <div className="mb-8">
                <label htmlFor="adminPhone" className="block text-lg font-semibold mb-2 flex items-center gap-2">
                    <Phone size={20} /> Número de WhatsApp del Admin
                </label>
                <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Este número se usará para que los usuarios te contacten al solicitar acceso. Incluye el código de país (ej: +591XXXXXXXX).
                </p>
                <input
                    id="adminPhone"
                    type="text"
                    value={newAdminPhone}
                    onChange={(e) => setNewAdminPhone(e.target.value)}
                    className={`w-full rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                    placeholder="+59168706660"
                />
            </div>

            {/* Gestión del QR */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Upload size={20} /> Código QR para Pagos
                </h2>
                {qrUrl && (
                    <div className="mb-4">
                        <p className="font-medium mb-2">QR Actual:</p>
                        <img src={qrUrl} alt="QR Actual" className="w-40 h-40 rounded-lg border-2" style={{ borderColor: isDark ? '#4b5563' : '#d1d5db' }} />
                    </div>
                )}
                <label htmlFor="newQrLink" className="block font-medium mb-1">
                    Nuevo enlace de imagen QR (opcional):
                </label>
                <input
                    id="newQrLink"
                    type="text"
                    value={newQrLink}
                    onChange={handleLinkChange}
                    className={`w-full rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                    placeholder="https://urldelaimagen.com/qr.png"
                />
            </div>

            {preview && (
                <div className="mb-6">
                    <p className="text-sm mb-2">Previsualización del nuevo QR:</p>
                    <img src={preview} alt="Previsualización" className="w-40 h-40 border rounded-lg" style={{ borderColor: isDark ? '#4b5563' : '#d1d5db' }} />
                </div>
            )}

            <button
                onClick={handleUpdateInfo}
                className="w-full text-white px-6 py-3 rounded-lg transition bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 font-bold"
                disabled={!newAdminPhone}
            >
                Guardar Cambios
            </button>
        </div>
    );
}