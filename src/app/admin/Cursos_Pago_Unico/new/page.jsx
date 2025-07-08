'use client';
import CourseForm from '../CourseForm';

export default function NewCoursePage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* Renderizamos el CourseForm sin pasarle props.
        De esta manera, el formulario sabrá que está en modo "creación":
        1. Los campos estarán vacíos.
        2. Al enviar, creará un nuevo documento en Firestore.
      */}
      <CourseForm />
    </div>
  );
}
