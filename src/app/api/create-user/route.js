import { NextResponse } from 'next/server'
import { auth, db } from '@/lib/firebaseAdmin'

export async function POST(request) {
  try {
    const {
      fullName,
      fechaNacimiento,
      sexo,
      telefono,
      universidad,
      profesion,
      email,
      password,
      rol
    } = await request.json()

    // Crea el usuario en Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName
    })

    // Graba los datos en Firestore, AÑADIENDO EL NUEVO CAMPO
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
        email,
        rol,
        active: false,
        isPremium: false,
        fechaSuscripcion: '-',
        fechaVencimiento: '-',
        // --- ¡MEJORA IMPLEMENTADA AQUÍ! ---
        // Añadimos el campo con valor `false` por defecto.
        hasPagoUnicoAccess: false,
        createdAt: new Date().toISOString(),
        mesesSuscrito: 0
      })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error('create-user error:', error)
    // Devolvemos un mensaje de error más específico para el frontend
    let errorMessage = 'Ocurrió un error al registrar el usuario.';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'El correo electrónico ya está en uso por otra cuenta.';
    } else if (error.code === 'auth/invalid-password') {
      errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
