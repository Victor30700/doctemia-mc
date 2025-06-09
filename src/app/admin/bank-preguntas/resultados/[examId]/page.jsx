"use client";
import { useState, useEffect, Suspense } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import '@/app/styles/resultadosExam.css';

function ResultadosContent() {
  const { examId } = useParams();
  const router = useRouter();

  const [attempts, setAttempts] = useState([]);
  const [examTitle, setExamTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!examId) return;

    const fetchResults = async () => {
      setLoading(true);
      try {
        // Obtener título del examen
        const examSnap = await getDoc(doc(db, 'exams', examId));
        if (examSnap.exists()) {
          setExamTitle(examSnap.data().title);
        } else {
          console.warn("Título del examen no encontrado");
        }

        // Obtener intentos
        const q = query(
          collection(db, 'examAttempts'),
          where('examId', '==', examId)
        );
        const snapshot = await getDocs(q);
        const data = [];
        snapshot.forEach(d => {
          data.push({ id: d.id, ...d.data() });
        });
        // Ordenar por puntaje descendente
        data.sort((a, b) => b.score - a.score);
        setAttempts(data);
      } catch (error) {
        console.error("Error al cargar resultados:", error);
        alert("Error al cargar los resultados.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [examId]);

  if (loading) {
    return <p className="loading-text">Cargando resultados...</p>;
  }

  return (
    <div className="resultados-container">
      <h1 className="page-title">
        Resultados del Examen: {examTitle || `ID: ${examId}`}
      </h1>
      <button
        className="back-button"
        onClick={() => router.back()}
      >
        Volver
      </button>

      {attempts.length === 0 ? (
        <p className="empty-text">Nadie ha realizado este examen todavía.</p>
      ) : (
        <table className="resultados-table">
          <thead>
            <tr>
              <th>Usuario (Email)</th>
              <th>Puntaje</th>
              <th>Estado</th>
              <th>Fecha Completado</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map(attempt => (
              <tr key={attempt.id}>
                <td>{attempt.userEmail}</td>
                <td>{attempt.score}/100</td>
                <td
                  className={
                    attempt.resultStatus === 'aprobado'
                      ? 'status-approved'
                      : 'status-failed'
                  }
                >
                  {attempt.resultStatus}
                </td>
                <td>
                  {attempt.completedAt
                    ? new Date(
                        attempt.completedAt.seconds * 1000
                      ).toLocaleString()
                    : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function ResultadosPage() {
  return (
    <Suspense fallback={<div className="loading-text">Cargando...</div>}>
      <ResultadosContent />
    </Suspense>
  );
}
