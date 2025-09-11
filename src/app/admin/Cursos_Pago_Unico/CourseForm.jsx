'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, updateDoc, doc, serverTimestamp, collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { singlePaymentCoursesCollectionRef } from '@/lib/db';
import Swal from 'sweetalert2';
import { useTheme } from '@/context/ThemeContext';
import { Book, FileText, Link as LinkIcon, Image as ImageIcon, Layers, Video, Plus, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';

// Componente para el formulario de Cursos de Pago Único con mejoras de estilo y funcionalidad
export default function CourseForm({ course, courseId }) {
  const router = useRouter();
  const { isDark } = useTheme();

  // Estados del formulario
  const [title, setTitle] = useState(course ? course.title : '');
  const [description, setDescription] = useState(course ? course.description : '');
  const [imageUrl, setImageUrl] = useState(course ? course.imageUrl : '');
  const [summaryDriveLink, setSummaryDriveLink] = useState(course ? course.summaryDriveLink : '');
  const [categoryId, setCategoryId] = useState(course ? course.categoryId : '');
  const [isActive, setIsActive] = useState(course?.isActive !== undefined ? course.isActive : true); // Nuevo estado para Activo/Inactivo
  const [categories, setCategories] = useState([]);
  const [modules, setModules] = useState(
    course?.modules && course.modules.length > 0 
      ? course.modules.map(module => ({
          ...module,
          videos: module.videos.map(video => ({
            title: video.title || '',
            url: video.url || '',
            driveLink: video.driveLink || '', // Agregar driveLink si existe
            showDriveLink: video.driveLink ? true : false // Mostrar el campo si ya tiene un link
          }))
        }))
      : [{ title: '', videos: [{ title: '', url: '', driveLink: '', showDriveLink: false }] }]
  );
  const [loading, setLoading] = useState(false);

  const swalTheme = {
    background: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
    confirmButtonColor: '#4f46e5', // Indigo
    cancelButtonColor: '#ef4444', // Red
  };

  // Hook para obtener las categorías de Firestore
  useEffect(() => {
    const categoriesRef = collection(db, 'course_categories');
    const unsubscribe = onSnapshot(categoriesRef, (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      categoriesData.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(categoriesData);
    });
    return () => unsubscribe();
  }, []);

  // --- MANEJADORES PARA MÓDULOS Y VIDEOS ---
  const handleModuleChange = (index, event) => {
    const newModules = [...modules];
    newModules[index][event.target.name] = event.target.value;
    setModules(newModules);
  };

  const addModule = () => {
    setModules([...modules, { title: '', videos: [{ title: '', url: '', driveLink: '', showDriveLink: false }] }]);
  };

  const removeModule = (index) => {
    if (modules.length > 1) {
      const newModules = [...modules];
      newModules.splice(index, 1);
      setModules(newModules);
    } else {
      Swal.fire({ title: 'Aviso', text: 'Debe haber al menos un módulo.', icon: 'info', ...swalTheme });
    }
  };

  const handleVideoChange = (moduleIndex, videoIndex, event) => {
    const newModules = [...modules];
    newModules[moduleIndex].videos[videoIndex][event.target.name] = event.target.value;
    setModules(newModules);
  };

  const addVideo = (moduleIndex) => {
    const newModules = [...modules];
    newModules[moduleIndex].videos.push({ title: '', url: '', driveLink: '', showDriveLink: false });
    setModules(newModules);
  };

  const removeVideo = (moduleIndex, videoIndex) => {
    const newModules = [...modules];
    if (newModules[moduleIndex].videos.length > 1) {
      newModules[moduleIndex].videos.splice(videoIndex, 1);
      setModules(newModules);
    } else {
      Swal.fire({ title: 'Aviso', text: 'Debe haber al menos un video por módulo.', icon: 'info', ...swalTheme });
    }
  };

  // --- NUEVAS FUNCIONES PARA MANEJAR LINKS DE DRIVE ---
  const toggleDriveLink = (moduleIndex, videoIndex) => {
    const newModules = [...modules];
    const video = newModules[moduleIndex].videos[videoIndex];
    video.showDriveLink = !video.showDriveLink;
    if (!video.showDriveLink) {
      video.driveLink = ''; // Limpiar el link cuando se oculta
    }
    setModules(newModules);
  };

  const handleDriveLinkChange = (moduleIndex, videoIndex, value) => {
    const newModules = [...modules];
    newModules[moduleIndex].videos[videoIndex].driveLink = value;
    setModules(newModules);
  };

  // --- MANEJADOR PARA ENVIAR EL FORMULARIO ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
        Swal.fire({ title: 'Campo Obligatorio', text: 'El título del curso no puede estar vacío.', icon: 'warning', ...swalTheme });
        return;
    }
    setLoading(true);

    // Limpiar los datos antes de enviar
    const cleanedModules = modules.map(module => ({
      title: module.title,
      videos: module.videos.map(video => {
        const cleanedVideo = {
          title: video.title,
          url: video.url
        };
        // Solo incluir driveLink si está presente y showDriveLink es true
        if (video.showDriveLink && video.driveLink) {
          cleanedVideo.driveLink = video.driveLink;
        }
        return cleanedVideo;
      })
    }));

    const courseData = {
      title,
      description,
      imageUrl,
      summaryDriveLink,
      isActive,
      categoryId: categoryId || null,
      modules: cleanedModules,
      updatedAt: serverTimestamp(),
    };

    try {
      if (courseId) {
        const courseDoc = doc(singlePaymentCoursesCollectionRef, courseId);
        await updateDoc(courseDoc, courseData);
        Swal.fire({ title: 'Actualizado', text: 'El curso ha sido actualizado con éxito.', icon: 'success', ...swalTheme });
      } else {
        await addDoc(singlePaymentCoursesCollectionRef, {
          ...courseData,
          createdAt: serverTimestamp(),
        });
        Swal.fire({ title: 'Creado', text: 'El curso ha sido creado con éxito.', icon: 'success', ...swalTheme });
      }
      router.push('/admin/Cursos_Pago_Unico');
    } catch (error) {
      console.error("Error saving course: ", error);
      Swal.fire({ title: 'Error', text: 'Hubo un error al guardar el curso.', icon: 'error', ...swalTheme });
    } finally {
      setLoading(false);
    }
  };

  const inputBaseClasses = "w-full rounded-md border-0 py-2.5 px-4 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-colors duration-200";
  const inputThemeClasses = isDark ? "bg-gray-700 text-white ring-gray-600 placeholder:text-gray-400" : "bg-white text-gray-900 ring-gray-300 placeholder:text-gray-400";
  const labelClasses = "block text-sm font-medium leading-6 " + (isDark ? "text-gray-300" : "text-gray-900");

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
            <div className="space-y-2">
                <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{courseId ? 'Editar' : 'Crear'} Curso</h1>
                <p className={`text-md ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {courseId ? 'Modifica los detalles del curso.' : 'Completa la información para crear un nuevo curso.'}
                </p>
            </div>

            {/* --- SECCIÓN DE DATOS PRINCIPALES --- */}
            <div className={`p-6 border rounded-lg shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h2 className="text-lg font-semibold leading-7 text-indigo-400 mb-6">Información General</h2>
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                        <label htmlFor="title" className={labelClasses}>Título del Curso <span className="text-red-500">*</span></label>
                        <div className="mt-2">
                            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className={`${inputBaseClasses} ${inputThemeClasses}`} />
                        </div>
                    </div>
                    <div className="sm:col-span-3">
                        <label htmlFor="category" className={labelClasses}>Categoría (Opcional)</label>
                        <div className="mt-2">
                            <select id="category" value={categoryId || ''} onChange={(e) => setCategoryId(e.target.value)} className={`${inputBaseClasses} ${inputThemeClasses}`}>
                                <option value="">-- Sin categoría --</option>
                                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="sm:col-span-3">
                        <label htmlFor="status" className={labelClasses}>Estado del Curso</label>
                        <div className="mt-2">
                            <select id="status" value={isActive} onChange={(e) => setIsActive(e.target.value === 'true')} className={`${inputBaseClasses} ${inputThemeClasses}`}>
                                <option value="true">Activo (Visible para usuarios)</option>
                                <option value="false">Inactivo (Oculto para usuarios)</option>
                            </select>
                        </div>
                    </div>
                    <div className="sm:col-span-6">
                        <label htmlFor="description" className={labelClasses}>Descripción</label>
                        <div className="mt-2">
                            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="4" className={`${inputBaseClasses} ${inputThemeClasses}`}></textarea>
                        </div>
                    </div>
                    <div className="sm:col-span-3">
                        <label htmlFor="imageUrl" className={labelClasses}>URL de la Imagen</label>
                        <div className="mt-2">
                            <input type="text" id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" className={`${inputBaseClasses} ${inputThemeClasses}`} />
                        </div>
                    </div>
                    <div className="sm:col-span-3">
                        <label htmlFor="summaryDriveLink" className={labelClasses}>Link de Resumen (Drive)</label>
                        <div className="mt-2">
                            <input type="text" id="summaryDriveLink" value={summaryDriveLink} onChange={(e) => setSummaryDriveLink(e.target.value)} placeholder="https://docs.google.com/..." className={`${inputBaseClasses} ${inputThemeClasses}`} />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN DE MÓDULOS Y VIDEOS --- */}
            <div className={`p-6 border rounded-lg shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                 <h2 className="text-lg font-semibold leading-7 text-indigo-400 mb-6">Contenido del Curso</h2>
                <div className="space-y-6">
                    {modules.map((module, moduleIndex) => (
                        <div key={moduleIndex} className={`p-4 border rounded-md ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Módulo {moduleIndex + 1}</h3>
                                <button type="button" onClick={() => removeModule(moduleIndex)} className="text-red-600 hover:text-red-500 p-1 rounded-full transition-colors"><Trash2 size={18} /></button>
                            </div>
                            <input type="text" name="title" value={module.title} onChange={(e) => handleModuleChange(moduleIndex, e)} placeholder="Título del Módulo" className={`mb-4 ${inputBaseClasses} ${inputThemeClasses}`} />
                            <div className="space-y-3 pl-4 border-l-2 border-indigo-500">
                                {module.videos.map((video, videoIndex) => (
                                    <div key={videoIndex} className={`p-3 border rounded-md relative ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                        <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Video {videoIndex + 1}</h4>
                                        <div className="space-y-2">
                                            <input 
                                                type="text" 
                                                name="title" 
                                                value={video.title} 
                                                onChange={(e) => handleVideoChange(moduleIndex, videoIndex, e)} 
                                                placeholder="Título del Video" 
                                                className={`${inputBaseClasses} ${inputThemeClasses}`} 
                                            />
                                            <input 
                                                type="text" 
                                                name="url" 
                                                value={video.url} 
                                                onChange={(e) => handleVideoChange(moduleIndex, videoIndex, e)} 
                                                placeholder="URL del Video" 
                                                className={`${inputBaseClasses} ${inputThemeClasses}`} 
                                            />
                                            
                                            {/* NUEVA SECCIÓN: Link de Drive para cada video */}
                                            {video.showDriveLink ? (
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        value={video.driveLink} 
                                                        onChange={(e) => handleDriveLinkChange(moduleIndex, videoIndex, e.target.value)} 
                                                        placeholder="Link de Resumen Drive (https://docs.google.com/...)" 
                                                        className={`${inputBaseClasses} ${inputThemeClasses} pr-10`} 
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleDriveLink(moduleIndex, videoIndex)}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-red-600 hover:text-red-500 p-1 rounded-full transition-colors"
                                                        title="Quitar Link de Drive"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleDriveLink(moduleIndex, videoIndex)}
                                                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    <LinkIcon size={16} />
                                                    Agregar Link de Drive
                                                </button>
                                            )}
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => removeVideo(moduleIndex, videoIndex)} 
                                            className="absolute top-2 right-2 text-red-600 hover:text-red-500 p-1 rounded-full transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    type="button" 
                                    onClick={() => addVideo(moduleIndex)} 
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 mt-2"
                                >
                                    <Plus size={16} /> Añadir Video
                                </button>
                            </div>
                        </div>
                    ))}
                    <button 
                        type="button" 
                        onClick={addModule} 
                        className="inline-flex items-center gap-2 text-sm font-semibold text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300"
                    >
                        <Plus size={16} /> Añadir Módulo
                    </button>
                </div>
            </div>

            {/* --- BOTONES DE ACCIÓN --- */}
            <div className="flex items-center justify-end gap-x-6">
                <button 
                    type="button" 
                    onClick={() => router.back()} 
                    className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-200"
                >
                    Cancelar
                </button>
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-400"
                >
                    {loading ? 'Guardando...' : (courseId ? 'Actualizar Curso' : 'Crear Curso')}
                </button>
            </div>
        </form>
    </div>
  );
}