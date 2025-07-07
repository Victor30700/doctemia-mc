'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import CourseForm from '../../CourseForm';
import { useParams } from 'next/navigation';

export default function EditCourse() {
  
  const { id: courseId } = useParams();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      if (courseId) {
        try {
          const docRef = doc(db, 'courses', courseId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setCourseData({ id: courseId, ...docSnap.data() });
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
    return <div className="p-8">Cargando datos del curso...</div>;
  }

  return (
    <div className="p-0">
      {courseData ? (
        <CourseForm course={courseData} />
      ) : (
        <p className="text-red-600">El curso no existe o hubo un error al cargarlo.</p>
      )}
    </div>
  );
}
