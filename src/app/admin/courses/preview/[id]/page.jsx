//src/app/admin/courses/preview/[id]/page.jsx
'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import ReactPlayer from 'react-player';

export default function PreviewCourse() {
  const { id: courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      if (courseId) {
        try {
          const docRef = doc(db, 'courses', courseId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setCourse(docSnap.data());
          }
        } catch (error) {
          console.error('Error fetching course:', error);
        }
      }
      setLoading(false);
    };
    fetchCourse();
  }, [courseId]);

  if (loading) {
    return <div className="p-8">Cargando curso...</div>;
  }

  if (!course) {
    return <div className="p-8 text-red-600">El curso no existe o hubo un error al cargarlo.</div>;
  }

  return (
    <section className="p-8 bg-gray-100 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">{course.name}</h1>
        <Link href="/admin/courses" className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded">Volver Atrás</Link>
      </div>

      <p className="text-lg text-gray-600 mb-4">{course.description}</p>
      <p className="text-lg text-gray-800 font-semibold mb-6">Precio: Bs{course.price.toFixed(2)}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {course.videos
          .sort((a, b) => a.order - b.order)
          .map((video, index) => (
            <div key={index} className="bg-white shadow-lg rounded-lg p-4">
              <h2 className="text-lg font-bold mb-2">Video {video.order}</h2>
              <p className="text-gray-600 mb-2">{video.description}</p>
              <div className="aspect-w-16 h-[200px] mb-2">
                <ReactPlayer
                url={video.url}
                width='100%'
                height='100%'
                controls={true}
                playing={false}
                light={true}
                config={{
                  youtube: {
                    playerVars: { disablekb: 1, modestbranding: 1, rel: 0 }
                  }
                }}
              />
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
