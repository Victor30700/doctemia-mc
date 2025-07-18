'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import Swal from 'sweetalert2';

export default function ProfilePage() {
  const { user, refreshUserData } = useAuth();
  const { isDark } = useTheme();
  const [profileData, setProfileData] = useState({
    fullName: '',
    fechaNacimiento: '',
    sexo: '',
    telefono: '',
    universidad: '',
    profesion: '',
    fechaExamen: '' // <-- NUEVO CAMPO AÑADIDO AL ESTADO
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    if (!user || initialLoaded) return;

    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data();
          setProfileData({
            fullName: data.fullName || '',
            fechaNacimiento: data.fechaNacimiento || '',
            sexo: data.sexo || '',
            telefono: data.telefono || '',
            universidad: data.universidad || '',
            profesion: data.profesion || '',
            fechaExamen: data.fechaExamen || '' // <-- SE OBTIENE EL NUEVO CAMPO
          });
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
        Swal.fire('Error', 'No se pudieron cargar los datos de tu perfil.', 'error');
      } finally {
        setLoadingProfile(false);
        setInitialLoaded(true);
      }
    };

    fetchProfile();
  }, [user, initialLoaded]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) {
      Swal.fire('Error', 'Usuario no identificado.', 'error');
      return;
    }

    setLoadingProfile(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      // ✅ CAMBIO: Se incluye el nuevo campo en la actualización
      await updateDoc(userDocRef, {
        fullName:        profileData.fullName,
        fechaNacimiento: profileData.fechaNacimiento,
        sexo:            profileData.sexo,
        telefono:        profileData.telefono,
        universidad:     profileData.universidad,
        profesion:       profileData.profesion,
        fechaExamen:     profileData.fechaExamen // <-- SE ACTUALIZA EL NUEVO CAMPO
      });

      if (refreshUserData) {
        await refreshUserData(auth.currentUser);
      }

      Swal.fire('¡Actualizado!', 'Tu perfil ha sido actualizado.', 'success');
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      Swal.fire('Error', `No se pudo actualizar: ${error.message}`, 'error');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { newPassword, confirmNewPassword } = passwordData;
    if (newPassword !== confirmNewPassword) {
      Swal.fire('Error', 'Las contraseñas no coinciden.', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      Swal.fire('Error', 'La contraseña debe tener 6 o más caracteres.', 'warning');
      return;
    }

    setLoadingPassword(true);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Swal.fire('Error', 'No hay usuario autenticado.', 'error');
      setLoadingPassword(false);
      return;
    }

    try {
      await updatePassword(currentUser, newPassword);
      Swal.fire('¡Actualizada!', 'Tu contraseña ha sido cambiada.', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      if (error.code === 'auth/requires-recent-login') {
        const { value: pwd } = await Swal.fire({
          title: 'Reautenticación',
          input: 'password',
          inputLabel: 'Contraseña actual',
          inputPlaceholder: 'Ingresa tu contraseña actual',
          showCancelButton: true,
          confirmButtonText: 'Reautenticar'
        });
        if (pwd) {
          try {
            const cred = EmailAuthProvider.credential(currentUser.email, pwd);
            await reauthenticateWithCredential(currentUser, cred);
            await updatePassword(currentUser, newPassword);
            Swal.fire('¡Actualizada!', 'Contraseña cambiada tras reautenticación.', 'success');
            setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
          } catch (reauthErr) {
            console.error('Error reautenticando:', reauthErr);
            Swal.fire('Error', `No se pudo verificar tu contraseña: ${reauthErr.message}`, 'error');
          }
        }
      } else {
        Swal.fire('Error', `No se pudo cambiar la contraseña: ${error.message}`, 'error');
      }
    } finally {
      setLoadingPassword(false);
    }
  };

  if (!user || (!initialLoaded && loadingProfile)) {
    return (
      <div className={`${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} flex justify-center items-center h-screen`}>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  const containerClass = `mx-auto p-4 max-w-2xl ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`;
  const headingClass = `text-3xl font-bold mb-8 text-center ${isDark ? 'text-gray-100' : 'text-gray-900'}`;
  const formBgClass = `${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md rounded-lg p-6 mb-8`;
  const sectionHeadingClass = `text-xl font-semibold mb-6 ${isDark ? 'text-gray-100' : 'text-gray-900'}`;
  const labelClass = `block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`;
  const inputClass = `mt-1 block w-full px-3 py-2 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
    isDark
      ? 'bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400'
      : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'
  }`;
  const profileButtonClass = `inline-flex justify-center py-2 px-4 rounded-md shadow-sm disabled:opacity-50 transition ${
    isDark ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
  }`;
  const passwordButtonClass = `inline-flex justify-center py-2 px-4 rounded-md shadow-sm disabled:opacity-50 transition ${
    isDark ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
  }`;

  return (
    <div className={containerClass}>
      <h1 className={headingClass}>Editar Perfil</h1>

      {/* Formulario de Perfil */}
      <form onSubmit={handleProfileSubmit} className={formBgClass}>
        <h2 className={sectionHeadingClass}>Información Personal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="fullName" className={labelClass}>Nombre Completo:</label>
            <input
              type="text"
              name="fullName"
              id="fullName"
              value={profileData.fullName}
              onChange={handleProfileChange}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="fechaNacimiento" className={labelClass}>Fecha de Nacimiento:</label>
            <input
              type="date"
              name="fechaNacimiento"
              id="fechaNacimiento"
              value={profileData.fechaNacimiento}
              onChange={handleProfileChange}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="sexo" className={labelClass}>Sexo:</label>
            <select
              name="sexo"
              id="sexo"
              value={profileData.sexo}
              onChange={handleProfileChange}
              className={inputClass}
            >
              <option value="">Seleccionar...</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Prefiero no decirlo">Prefiero no decirlo</option>
            </select>
          </div>
          <div>
            <label htmlFor="telefono" className={labelClass}>Teléfono:</label>
            <input
              type="tel"
              name="telefono"
              id="telefono"
              value={profileData.telefono}
              onChange={handleProfileChange}
              placeholder="+591..."
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="universidad" className={labelClass}>Universidad:</label>
            <input
              type="text"
              name="universidad"
              id="universidad"
              value={profileData.universidad}
              onChange={handleProfileChange}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="profesion" className={labelClass}>Profesión / Cargo:</label>
            <input
              type="text"
              name="profesion"
              id="profesion"
              value={profileData.profesion}
              onChange={handleProfileChange}
              className={inputClass}
            />
          </div>
          {/* --- ✅ NUEVO CAMPO AÑADIDO AL FORMULARIO --- */}
          <div>
            <label htmlFor="fechaExamen" className={labelClass}>Fecha de Examen:</label>
            <input
              type="date"
              name="fechaExamen"
              id="fechaExamen"
              value={profileData.fechaExamen}
              onChange={handleProfileChange}
              className={inputClass}
            />
          </div>
        </div>
        <div className="mt-8 text-right">
          <button type="submit" disabled={loadingProfile} className={profileButtonClass}>
            {loadingProfile ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>

      {/* Formulario de Cambio de Contraseña */}
      <form onSubmit={handlePasswordSubmit} className={formBgClass}>
        <h2 className={sectionHeadingClass}>Cambiar Contraseña</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="newPassword" className={labelClass}>Nueva Contraseña:</label>
            <input
              type="password"
              name="newPassword"
              id="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className={inputClass}
              required
              minLength={6}
            />
          </div>
          <div>
            <label htmlFor="confirmNewPassword" className={labelClass}>Confirmar Nueva Contraseña:</label>
            <input
              type="password"
              name="confirmNewPassword"
              id="confirmNewPassword"
              value={passwordData.confirmNewPassword}
              onChange={handlePasswordChange}
              className={inputClass}
              required
              minLength={6}
            />
          </div>
        </div>
        <div className="mt-8 text-right">
          <button type="submit" disabled={loadingPassword} className={passwordButtonClass}>
            {loadingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
        </div>
      </form>
    </div>
  );
}
