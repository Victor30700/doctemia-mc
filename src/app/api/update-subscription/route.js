// app/api/update-subscription/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(req) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }
    const { userId, fechaSuscripcion, cantidadMeses } = await req.json();

    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) throw new Error('Usuario no encontrado');

    const nuevaFechaSuscripcion = new Date(fechaSuscripcion);
    const nuevaFechaVencimiento = new Date(nuevaFechaSuscripcion);
    nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + 30 * cantidadMeses);

    const hoy = new Date();
    const isPremium = hoy >= nuevaFechaSuscripcion && hoy <= nuevaFechaVencimiento;

    await userRef.update({
      fechaSuscripcion: nuevaFechaSuscripcion,
      fechaVencimiento: nuevaFechaVencimiento,
      isPremium,
    });

    return NextResponse.json({ message: 'Suscripción actualizada' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
