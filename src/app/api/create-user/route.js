import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

export async function POST(request) {
  let createdUserRecord = null;
  
  try {
    if (!auth || !db) {
      return NextResponse.json({ error: 'Servidor no inicializado (Firebase)' }, { status: 500 });
    }

    const body = await request.json();
    const {
      fullName,
      fechaNacimiento,
      sexo,
      telefono,
      universidad,
      profesion,
      fechaExamen,
      email,
      password,
      rol,
    } = body;

    // 1. Crea el usuario en Firebase Authentication
    createdUserRecord = await auth.createUser({
      email,
      password,
      displayName: fullName,
    });

    // 2. Graba los datos adicionales del usuario en Firestore
    try {
      await db
        .collection('users')
        .doc(createdUserRecord.uid)
        .set({
          fullName: fullName || '',
          fechaNacimiento: fechaNacimiento || '',
          sexo: sexo || '',
          telefono: telefono || '',
          universidad: universidad || '', 
          profesion: profesion || '',
          fechaExamen: fechaExamen || null, 
          email: email || '',
          rol: rol || 'user',
          active: true, 
          isPremium: false,
          fechaSuscripcion: '-',
          fechaVencimiento: '-',
          hasPagoUnicoAccess: false,
          createdAt: new Date().toISOString(),
          mesesSuscrito: 0,
        });
        
      return NextResponse.json({ ok: true }, { status: 201 });

    } catch (firestoreError) {
      console.error('Error al guardar en Firestore:', firestoreError);
      
      // SI FALLA FIRESTORE, BORRAMOS EL USUARIO DE AUTH PARA EVITAR CUENTAS HUÉRFANAS
      if (createdUserRecord) {
        await auth.deleteUser(createdUserRecord.uid);
        console.log(`Usuario ${createdUserRecord.uid} eliminado de Auth por fallo en Firestore.`);
      }
      
      throw firestoreError; // Relanzamos para que lo capture el catch principal
    }

  } catch (error) {
    console.error('create-user error final:', error);
    
    let errorMessage = 'Ocurrió un error al registrar el usuario.';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'El correo electrónico ya está en uso.';
    } else if (error.message.includes('Quota exceeded')) {
      errorMessage = 'Límite de cuota de Firebase excedido.';
    }
    
    return NextResponse.json({ 
      error: errorMessage, 
      details: error.message,
      code: error.code 
    }, { status: 500 });
  }
}
