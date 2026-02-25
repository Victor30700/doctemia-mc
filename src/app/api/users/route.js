import { db } from "@/lib/firebase-admin";
import { NextResponse } from 'next/server';

function formatDate(field) {
  if (field?.toDate) {
    return field.toDate().toISOString().split('T')[0];
  }
  if (typeof field === 'string') {
    return field;
  }
  return '';
}

export async function GET() {
  try {
    if (!db) {
      console.error("Firebase Admin DB no está inicializado. Verifica las variables de entorno.");
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
    }

    const snapshot = await db.collection('users').get();

    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaSuscripcion: formatDate(doc.data().fechaSuscripcion),
      fechaVencimiento: formatDate(doc.data().fechaVencimiento),
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json({ error: "Error interno al obtener usuarios" }, { status: 500 });
  }
}
