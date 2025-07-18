// src/app/api/delete-user/route.js
import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

// Usamos el método DELETE que es semánticamente correcto para esta acción.
export async function DELETE(req) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID es requerido' }, { status: 400 });
    }

    // Paso 1: Eliminar el usuario de Firebase Authentication.
    // Esto previene que el usuario pueda volver a iniciar sesión.
    await auth.deleteUser(userId);

    // Paso 2: Eliminar el documento del usuario de Firestore.
    // Esto elimina todos los datos asociados al usuario en tu base de datos.
    await db.collection('users').doc(userId).delete();

    return NextResponse.json({ message: 'Usuario eliminado con éxito de Auth y Firestore' });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);

    // Manejar el caso en que el usuario no se encuentre
    if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ error: 'Usuario no encontrado en Firebase Authentication' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Error interno del servidor al eliminar el usuario', details: error.message }, { status: 500 });
  }
}
