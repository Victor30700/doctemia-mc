// src/app/app/admin/qr-gestion/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast, Toaster } from 'react-hot-toast';

export default function QRGestionPage() {
  const [qrActual, setQrActual] = useState('');
  const [nuevoLink, setNuevoLink] = useState('');
  const [previsualizacion, setPrevisualizacion] = useState('');
  const [validando, setValidando] = useState(false);

  const docRef = doc(db, 'pags', 'qr');

  useEffect(() => {
    const cargarQR = async () => {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setQrActual(docSnap.data().url);
      }
    };
    cargarQR();
  }, []);

  const validarYPrevisualizar = async (link) => {
    setPrevisualizacion('');
    setValidando(true);

    try {
      const res = await fetch(link, { method: 'HEAD' });
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType?.startsWith('image')) {
        setPrevisualizacion(link);
      } else {
        toast.error('El enlace no es válido o no es una imagen.');
      }
    } catch (err) {
      toast.error('No se pudo validar el enlace.');
    }

    setValidando(false);
  };

  const manejarCambioLink = (e) => {
    const valor = e.target.value;
    setNuevoLink(valor);
    if (valor.startsWith('http')) {
      validarYPrevisualizar(valor);
    } else {
      setPrevisualizacion('');
    }
  };

  const actualizarQR = async () => {
    if (!previsualizacion) {
      toast.error('No puedes guardar un enlace inválido.');
      return;
    }

    try {
      await setDoc(docRef, { url: previsualizacion });
      setQrActual(previsualizacion);
      setNuevoLink('');
      setPrevisualizacion('');
      toast.success('QR actualizado correctamente.');
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar el QR.');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md mt-10">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">Gestión de Código QR</h1>

      <div className="mb-4">
        <h2 className="font-semibold text-gray-700 mb-2">QR Actual:</h2>
        {qrActual ? (
          <img src={qrActual} alt="QR Actual" className="w-48 h-auto rounded border" />
        ) : (
          <p className="text-gray-500">No se ha establecido aún.</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="nuevo" className="block font-medium text-gray-700 mb-1">
          Nuevo enlace de imagen QR:
        </label>
        <input
          id="nuevo"
          type="text"
          value={nuevoLink}
          onChange={manejarCambioLink}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
          placeholder="https://..."
        />
      </div>

      {validando && <p className="text-sm text-gray-500">Validando enlace...</p>}

      {previsualizacion && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Previsualización:</p>
          <img src={previsualizacion} alt="Previsualización" className="w-48 h-auto border rounded" />
        </div>
      )}

      <button
        disabled={!previsualizacion}
        onClick={actualizarQR}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        Actualizar QR
      </button>

      <Toaster position="top-right" />
    </div>
  );
}
