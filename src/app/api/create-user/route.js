import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    const {
      fullName,
      fechaNacimiento,
      sexo,
      telefono,
      universidad,
      profesion,
      fechaExamen, // <-- NUEVO CAMPO RECIBIDO
      email,
      password,
      rol,
    } = await request.json();

    // Crea el usuario en Firebase Authentication
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName,
    });

    // Graba los datos adicionales del usuario en Firestore
    await db
      .collection('users')
      .doc(userRecord.uid)
      .set({
        fullName,
        fechaNacimiento,
        sexo,
        telefono,
        universidad,
        profesion,
        fechaExamen, // <-- NUEVO CAMPO GUARDADO
        email,
        rol,
        active: true, // <-- CAMBIO: El valor ahora es 'true' por defecto
        isPremium: false,
        fechaSuscripcion: '-',
        fechaVencimiento: '-',
        hasPagoUnicoAccess: false,
        createdAt: new Date().toISOString(),
        mesesSuscrito: 0,
      });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('create-user error:', error);
    
    // Devolvemos un mensaje de error más específico para el frontend
    let errorMessage = 'Ocurrió un error al registrar el usuario.';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'El correo electrónico ya está en uso por otra cuenta.';
    } else if (error.code === 'auth/invalid-password') {
      errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
