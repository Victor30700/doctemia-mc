// src/app/api/toggle-active/route.js
import { NextResponse } from 'next/server';
// CORRECCIÓN: Se importa 'db' desde el archivo correcto 'firebaseAdmin.js'
import { db } from '@/lib/firebaseAdmin';

export async function POST(req) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID es requerido' }, { status: 400 });
    }

    // CORRECCIÓN: Se usa 'db' en lugar del inexistente 'dbAdmin'
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // La lógica para cambiar el estado es correcta.
    const currentStatus = userSnap.data().active || false;
    await userRef.update({ active: !currentStatus });

    return NextResponse.json({ 
      message: `Usuario ${!currentStatus ? 'activado' : 'desactivado'} correctamente` 
    });
  } catch (error) {
    console.error('Error en toggle-active:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}
