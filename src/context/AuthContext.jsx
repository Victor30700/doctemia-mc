// src/context/AuthContext.jsx
'use client';
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { auth, db } from '@/lib/firebase'; // Asegúrate de importar db
import { onAuthStateChanged, getIdTokenResult, signOut as fbSignOut } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore'; // Importar doc y onSnapshot
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null); // Este user contendrá los datos de Firestore combinados
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseAuthUser, setFirebaseAuthUser] = useState(null); // Para mantener el usuario de Firebase Auth separado si es necesario

  useEffect(() => {
    setLoading(true);
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseAuthUser(fbUser); // Guardar el usuario de Firebase Auth
      if (fbUser) {
        console.log('AuthContext: Firebase user detected:', fbUser.uid);
        try {
          const tokenResult = await getIdTokenResult(fbUser, true); // Forzar refresh del token
          const emailFallback = fbUser.email === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@admin.com') ? 'admin' : 'user';
          const assignedRole = tokenResult.claims.role || emailFallback;
          setRole(assignedRole);
          console.log('AuthContext: Role assigned:', assignedRole);

          // Ahora, escuchar los datos del usuario desde Firestore
          const userDocRef = doc(db, 'users', fbUser.uid);
          const unsubFirestore = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              console.log('AuthContext: Firestore user data received:', docSnap.data());
              // Combinar datos de Firebase Auth con los de Firestore
              setUser({
                uid: fbUser.uid, // Desde Firebase Auth
                email: fbUser.email, // Desde Firebase Auth
                displayName: fbUser.displayName, // Desde Firebase Auth (si lo usas)
                // ...otros campos de fbUser que quieras mantener
                ...docSnap.data() // Todos los campos de tu documento en Firestore (incluyendo cursosPagados)
              });
            } else {
              console.warn('AuthContext: User document does not exist in Firestore for uid:', fbUser.uid);
              // El usuario está autenticado en Firebase pero no tiene documento en Firestore
              // Decide cómo manejar esto: ¿crear un documento? ¿usar datos básicos?
              setUser({ // Establecer un usuario básico sin datos de Firestore
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: fbUser.displayName,
                // Puedes añadir campos por defecto si es necesario, ej: cursosPagados: []
              });
            }
            setLoading(false); // Mover setLoading(false) aquí, después de tener el usuario completo
          }, (error) => {
            console.error("AuthContext: Error listening to Firestore user document:", error);
            setUser({ uid: fbUser.uid, email: fbUser.email, displayName: fbUser.displayName }); // Fallback a datos básicos
            setLoading(false);
          });

          // Retornar la función de desuscripción para Firestore
          return () => {
            console.log('AuthContext: Unsubscribing from Firestore user document for', fbUser.uid);
            unsubFirestore();
          };

        } catch (error) {
          console.error("AuthContext: Error getting token result or setting up Firestore listener:", error);
          setUser(null);
          setRole(null);
          setLoading(false);
        }
      } else {
        console.log('AuthContext: No Firebase user authenticated.');
        setUser(null);
        setRole(null);
        setFirebaseAuthUser(null);
        setLoading(false);
      }
    });

    // Retornar la función de desuscripción para onAuthStateChanged
    return () => {
      console.log('AuthContext: Unsubscribing from onAuthStateChanged.');
      unsubAuth();
    };
  }, []); // Ejecutar solo una vez al montar

  const signOut = async () => {
    setLoading(true);
    console.log('AuthContext: Iniciando signOut...');
    try {
      const response = await fetch('/api/logout', { method: 'POST' });
      if (!response.ok) {
        console.error('AuthContext: Falló la llamada a /api/logout', await response.text());
      } else {
        console.log('AuthContext: Llamada a /api/logout exitosa.');
      }
      await fbSignOut(auth);
      console.log('AuthContext: Firebase signOut completado.');
      // setUser y setRole se limpiarán por onAuthStateChanged
      console.log('AuthContext: Redirigiendo a /login...');
      router.push('/login');
    } catch (error) {
      console.error('AuthContext: Error durante signOut:', error);
      // Incluso si hay error, intenta limpiar localmente y redirigir
      setUser(null);
      setRole(null);
      setFirebaseAuthUser(null);
      setLoading(false); // Asegurar que loading se actualice
      router.push('/login'); // Forzar redirección
    }
    // setLoading(false) se maneja dentro del try/catch o por onAuthStateChanged
  };

  // Función para refrescar manualmente los datos del usuario desde Firestore
  // Útil si no quieres depender únicamente de onSnapshot o necesitas forzar una recarga
  const refreshUserData = useCallback(async () => {
    if (firebaseAuthUser && firebaseAuthUser.uid) {
      console.log('AuthContext: Refreshing user data for', firebaseAuthUser.uid);
      setLoading(true);
      try {
        const userDocRef = doc(db, 'users', firebaseAuthUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setUser({
            uid: firebaseAuthUser.uid,
            email: firebaseAuthUser.email,
            displayName: firebaseAuthUser.displayName,
            ...docSnap.data()
          });
        } else {
           console.warn('AuthContext (refreshUserData): User document does not exist in Firestore.');
           setUser({ uid: firebaseAuthUser.uid, email: firebaseAuthUser.email, displayName: firebaseAuthUser.displayName });
        }
      } catch (error) {
        console.error('AuthContext: Error refreshing user data:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [firebaseAuthUser]); // Depende del usuario de Firebase Auth

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut, refreshUserData, firebaseAuthUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
