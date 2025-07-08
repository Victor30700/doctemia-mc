'use client';
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, getIdTokenResult, signOut as fbSignOut } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'; // Importar setDoc y serverTimestamp
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseAuthUser, setFirebaseAuthUser] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseAuthUser(fbUser);
      if (fbUser) {
        console.log('AuthContext: Firebase user detected:', fbUser.uid);
        try {
          const tokenResult = await getIdTokenResult(fbUser, true);
          const emailFallback = fbUser.email === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@admin.com') ? 'admin' : 'user';
          const assignedRole = tokenResult.claims.role || emailFallback;
          setRole(assignedRole);
          console.log('AuthContext: Role assigned:', assignedRole);

          const userDocRef = doc(db, 'users', fbUser.uid);
          const unsubFirestore = onSnapshot(userDocRef, async (docSnap) => { // Hacemos el callback async
            if (docSnap.exists()) {
              console.log('AuthContext: Firestore user data received:', docSnap.data());
              setUser({
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: fbUser.displayName,
                ...docSnap.data()
              });
              setLoading(false);
            } else {
              // --- ¡SOLUCIÓN IMPLEMENTADA AQUÍ! ---
              // Si el documento no existe, lo creamos.
              console.warn(`AuthContext: User document does not exist for uid: ${fbUser.uid}. Creating it now.`);
              
              const newUserProfile = {
                email: fbUser.email,
                name: fbUser.displayName || 'Nuevo Usuario',
                photoURL: fbUser.photoURL || '/icons/user.jpg', // URL de avatar por defecto
                role: assignedRole, // Usamos el rol de los claims o el fallback
                createdAt: serverTimestamp(),
                isActive: true,
                subscription: null,
                cursosPagados: [], // Inicializamos el campo de cursos pagados
              };

              try {
                // Creamos el documento en Firestore
                await setDoc(userDocRef, newUserProfile);
                console.log("AuthContext: New user document created successfully in Firestore.");
                // Establecemos el usuario en el estado local para que la UI reaccione inmediatamente
                setUser({
                  uid: fbUser.uid,
                  ...newUserProfile
                });
              } catch (error) {
                console.error("AuthContext: FAILED to create user document:", error);
                // Si la creación falla, deslogueamos para evitar un estado inconsistente
                signOut();
              } finally {
                setLoading(false);
              }
            }
          }, (error) => {
            console.error("AuthContext: Error listening to Firestore user document:", error);
            setUser({ uid: fbUser.uid, email: fbUser.email, displayName: fbUser.displayName });
            setLoading(false);
          });

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

    return () => {
      console.log('AuthContext: Unsubscribing from onAuthStateChanged.');
      unsubAuth();
    };
  }, []);

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
      router.push('/login');
    } catch (error) {
      console.error('AuthContext: Error durante signOut:', error);
      router.push('/login');
    }
  };

  const refreshUserData = useCallback(async () => {
    if (firebaseAuthUser?.uid) {
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
  }, [firebaseAuthUser]);

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
