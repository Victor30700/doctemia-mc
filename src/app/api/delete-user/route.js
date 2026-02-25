// src/app/api/delete-user/route.js
import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

export async function DELETE(req) {
  try {
    const { userId, userIds } = await req.json();

    // Caso 1: Borrado múltiple
    if (userIds && Array.isArray(userIds)) {
      const results = { success: [], failed: [] };

      for (const id of userIds) {
        try {
          await auth.deleteUser(id);
          await db.collection('users').doc(id).delete();
          results.success.push(id);
        } catch (err) {
          console.error(`Error eliminando usuario ${id}:`, err);
          results.failed.push({ id, error: err.message });
        }
      }

      return NextResponse.json({ 
        message: `Proceso completado. Eliminados: ${results.success.length}, Fallidos: ${results.failed.length}`,
        results 
      });
    }

    // Caso 2: Borrado individual
    if (!userId) {
      return NextResponse.json({ error: 'User ID o lista de IDs es requerido' }, { status: 400 });
    }

    await auth.deleteUser(userId);
    await db.collection('users').doc(userId).delete();

    return NextResponse.json({ message: 'Usuario eliminado con éxito' });

  } catch (error) {
    console.error('Error en delete-user:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    }, { status: 500 });
  }
}
