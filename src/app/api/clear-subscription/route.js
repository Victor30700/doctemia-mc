import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(req) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }
    const { userId } = await req.json();

    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      fechaSuscripcion: '-',
      fechaVencimiento: '-',
      isPremium: false,
    });

    return NextResponse.json({ message: 'Suscripción eliminada' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
