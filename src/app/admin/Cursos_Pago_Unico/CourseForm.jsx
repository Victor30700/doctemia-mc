'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { useTheme } from '@/context/ThemeContext';

export default function CourseForm({ course }) {
  const router = useRouter();
  const { id: courseId } = useParams();
  const { isDark } = useTheme();

  const [name, setName] = useState(course?.name || '');
  const [description, setDescription] = useState(course?.description || '');
  const [price, setPrice] = useState(course?.price || '');
  const [image, setImage] = useState(course?.image || '');
  // Nuevo estado para el enlace del resumen de Drive
  const [summaryDriveLink, setSummaryDriveLink] = useState(course?.summaryDriveLink || '');
  const [isActive, setIsActive] = useState(course?.isActive !== undefined ? course.isActive : true);
  const [videos, setVideos] = useState(course?.videos || [{ url: '', description: '', order: 1 }]);

  const swalTheme = {
    background: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#ef4444',
  };

  const handleAddVideo = () => {
    setVideos([...videos, { url: '', description: '', order: videos.length + 1 }]);
  };

  const handleRemoveVideo = (index) => {
    if (videos.length > 1) {
      const updatedVideos = videos.filter((_, i) => i !== index);
      setVideos(updatedVideos.map((video, idx) => ({ ...video, order: idx + 1 })));
    }
  };

  const handleVideoChange = (index, field, value) => {
    const newVideos = [...videos];
    newVideos[index][field] = value;
    setVideos(newVideos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const courseData = {
      name,
      description,
      price: parseFloat(price),
      image,
      summaryDriveLink, // Añadir el nuevo campo a los datos del curso
      isActive,
      videos: videos.map((video, index) => ({
        url: video.url,
        description: video.description,
        order: index + 1,
      })),
    };

    try {
      if (courseId) {
        await updateDoc(doc(db, 'courses', courseId), courseData);
        Swal.fire({ title: 'Actualizado', text: 'El curso ha sido actualizado.', icon: 'success', ...swalTheme });
      } else {
        await addDoc(collection(db, 'courses'), courseData);
        Swal.fire({ title: 'Creado', text: 'El curso ha sido creado.', icon: 'success', ...swalTheme });
      }
      router.push('/admin/courses');
    } catch (error) {
      console.error('Error al guardar el curso:', error);
      Swal.fire({ title: 'Error', text: 'No se pudo guardar el curso.', icon: 'error', ...swalTheme });
    }
  };
  
  const labelStyle = { color: isDark ? '#d1d5db' : '#374151' };
  const inputStyle = {
    backgroundColor: isDark ? '#374151' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
    borderColor: isDark ? '#4b5563' : '#d1d5db'
  };

  return (
    <section 
      className="p-4 sm:p-6 min-h-screen transition-colors duration-300"
      style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
    >
      <div className='flex justify-between items-center mb-6'>
        <h1 
          className="text-2xl font-bold"
          style={{ color: isDark ? '#60a5fa' : '#3b82f6' }}
        >
          {courseId ? 'Editar Curso Pago Unico' : 'Agregar Curso Pago Unico'}
        </h1>
        <button onClick={() => router.push('/admin/courses')} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition">
          Volver Atrás
        </button>
      </div>
      
      <form 
        onSubmit={handleSubmit} 
        className="shadow-lg rounded-lg p-6 space-y-6 border"
        style={{ 
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderColor: isDark ? '#374151' : '#e5e7eb'
        }}
      >
        <div className="space-y-2">
          <label style={labelStyle}>Nombre del Curso:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded" style={inputStyle} required />
        </div>

        <div className="space-y-2">
          <label style={labelStyle}>Descripción del Curso:</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded" style={inputStyle} required></textarea>
        </div>

        <div className="space-y-2">
          <label style={labelStyle}>Precio del Curso (Bs):</label>
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2 border rounded" style={inputStyle} required />
        </div>

        <div className="space-y-2">
          <label style={labelStyle}>Imagen (URL):</label>
          <input type="text" value={image} onChange={(e) => setImage(e.target.value)} className="w-full p-2 border rounded" style={inputStyle} required />
        </div>

        {/* Campo para el Resumen del Curso (Link de Drive) */}
        <div className="space-y-2">
          <label style={labelStyle}>Resumen del curso (Link Drive):</label>
          <input 
            type="text" 
            value={summaryDriveLink} 
            onChange={(e) => setSummaryDriveLink(e.target.value)} 
            className="w-full p-2 border rounded" 
            style={inputStyle} 
            placeholder="https://docs.google.com/..."
          />
        </div>

        <div className="space-y-2">
          <label style={labelStyle}>Estado del Curso:</label>
          <select value={isActive} onChange={(e) => setIsActive(e.target.value === 'true')} className="w-full p-2 border rounded" style={inputStyle}>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>

        <div className="space-y-4">
          <label style={labelStyle}>Videos del Curso:</label>
          {videos.map((video, index) => (
            <div key={index} className="flex items-center gap-2 mb-2 p-3 rounded border" style={{ borderColor: isDark ? '#4b5563' : '#e5e7eb' }}>
              <div className="flex-grow space-y-2">
                <input
                  type="text"
                  value={video.url}
                  onChange={(e) => handleVideoChange(index, 'url', e.target.value)}
                  placeholder="URL del Video"
                  className="w-full p-2 border rounded"
                  style={inputStyle}
                  required
                />
                <input
                  type="text"
                  value={video.description}
                  onChange={(e) => handleVideoChange(index, 'description', e.target.value)}
                  placeholder="Descripción del Video"
                  className="w-full p-2 border rounded"
                  style={inputStyle}
                  required
                />
              </div>
              {videos.length > 1 && (
                <button type="button" onClick={() => handleRemoveVideo(index)} className="bg-red-600 text-white px-3 py-2 rounded self-start hover:bg-red-700 transition">X</button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddVideo} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition">
            Añadir Video +
          </button>
        </div>

        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-bold text-lg transition">
          {courseId ? 'Actualizar Curso' : 'Crear Curso'}
        </button>
      </form>
    </section>
  );
}
