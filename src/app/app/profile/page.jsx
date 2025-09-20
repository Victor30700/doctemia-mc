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
import { User, Lock, Save, Eye, EyeOff, Calendar, Phone, Building, Briefcase, GraduationCap, UserCheck } from 'lucide-react';

// Paleta de colores
const COLORS = {
  primary: '#014ba0',      // Turquesa principal
  secondary: '#014ba0',    // Azul oscuro
  accent: '#CF8A40',       // Naranja/Dorado
  dark: '#2E4A70',         // Azul oscuro
  neutral: '#F0F2F2',      // Gris claro
  background: '#FFF9F0'    // Fondo crema
};

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
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

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
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar los datos de tu perfil.',
          icon: 'error',
          confirmButtonColor: COLORS.primary,
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f9fafb' : COLORS.dark
        });
      } finally {
        setLoadingProfile(false);
        setInitialLoaded(true);
      }
    };

    fetchProfile();
  }, [user, initialLoaded, isDark]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) {
      Swal.fire({
        title: 'Error',
        text: 'Usuario no identificado.',
        icon: 'error',
        confirmButtonColor: COLORS.primary,
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : COLORS.dark
      });
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

      Swal.fire({
        title: '¡Actualizado!',
        text: 'Tu perfil ha sido actualizado correctamente.',
        icon: 'success',
        confirmButtonColor: COLORS.primary,
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : COLORS.dark
      });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      Swal.fire({
        title: 'Error',
        text: `No se pudo actualizar: ${error.message}`,
        icon: 'error',
        confirmButtonColor: COLORS.primary,
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : COLORS.dark
      });
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
      Swal.fire({
        title: 'Error',
        text: 'Las contraseñas no coinciden.',
        icon: 'warning',
        confirmButtonColor: COLORS.primary,
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : COLORS.dark
      });
      return;
    }
    if (newPassword.length < 6) {
      Swal.fire({
        title: 'Error',
        text: 'La contraseña debe tener 6 o más caracteres.',
        icon: 'warning',
        confirmButtonColor: COLORS.primary,
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : COLORS.dark
      });
      return;
    }

    setLoadingPassword(true);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Swal.fire({
        title: 'Error',
        text: 'No hay usuario autenticado.',
        icon: 'error',
        confirmButtonColor: COLORS.primary,
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : COLORS.dark
      });
      setLoadingPassword(false);
      return;
    }

    try {
      await updatePassword(currentUser, newPassword);
      Swal.fire({
        title: '¡Actualizada!',
        text: 'Tu contraseña ha sido cambiada exitosamente.',
        icon: 'success',
        confirmButtonColor: COLORS.primary,
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : COLORS.dark
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      if (error.code === 'auth/requires-recent-login') {
        const { value: pwd } = await Swal.fire({
          title: 'Reautenticación Requerida',
          input: 'password',
          inputLabel: 'Contraseña actual',
          inputPlaceholder: 'Ingresa tu contraseña actual',
          showCancelButton: true,
          confirmButtonText: 'Reautenticar',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: COLORS.primary,
          cancelButtonColor: COLORS.accent,
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f9fafb' : COLORS.dark,
          inputAttributes: {
            style: `border: 1px solid #014ba0; border-radius: 8px; padding: 8px;`
          }
        });
        if (pwd) {
          try {
            const cred = EmailAuthProvider.credential(currentUser.email, pwd);
            await reauthenticateWithCredential(currentUser, cred);
            await updatePassword(currentUser, newPassword);
            Swal.fire({
              title: '¡Actualizada!',
              text: 'Contraseña cambiada tras reautenticación exitosa.',
              icon: 'success',
              confirmButtonColor: COLORS.primary,
              background: isDark ? '#1f2937' : '#ffffff',
              color: isDark ? '#f9fafb' : COLORS.dark
            });
            setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
          } catch (reauthErr) {
            console.error('Error reautenticando:', reauthErr);
            Swal.fire({
              title: 'Error',
              text: `No se pudo verificar tu contraseña: ${reauthErr.message}`,
              icon: 'error',
              confirmButtonColor: COLORS.primary,
              background: isDark ? '#1f2937' : '#ffffff',
              color: isDark ? '#f9fafb' : COLORS.dark
            });
          }
        }
      } else {
        Swal.fire({
          title: 'Error',
          text: `No se pudo cambiar la contraseña: ${error.message}`,
          icon: 'error',
          confirmButtonColor: COLORS.primary,
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f9fafb' : COLORS.dark
        });
      }
    } finally {
      setLoadingPassword(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!user || (!initialLoaded && loadingProfile)) {
    return (
      <div 
        className="flex justify-center items-center h-screen"
        style={{ backgroundColor: COLORS.background }}
      >
        <div className="text-center">
          <div 
            className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mx-auto mb-4"
            style={{ borderColor: COLORS.primary, borderTopColor: 'transparent' }}
          ></div>
          <p 
            className="text-xl font-semibold"
            style={{ color: isDark ? '#f9fafb' : COLORS.dark }}
          >
            Cargando perfil...
          </p>
        </div>
      </div>
    );
  }

  const getInputStyles = (isDark) => ({
    backgroundColor: isDark ? '#374151' : 'white',
    borderColor: '#014ba0',
    color: isDark ? '#f9fafb' : COLORS.dark,
    borderWidth: '1px',
    borderRadius: '12px'
  });

  const getCardStyles = (isDark) => ({
    backgroundColor: isDark ? '#1f2937' : 'white',
    border: `1px solid ${COLORS.neutral}`,
    borderRadius: '20px',
    boxShadow: isDark 
      ? `0 10px 40px rgba(0,0,0,0.3)` 
      : `0 10px 40px rgba(1, 75, 160, 0.12)`
  });

  return (
    <div 
      className="min-h-screen transition-colors"
      style={{ backgroundColor: COLORS.background }}
    >
      {/* Header con gradiente */}
      <div 
        className="p-6 pb-8"
        style={{ 
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, #014ba0 100%)`,
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <User className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Mi Perfil
            </h1>
          </div>
          <p className="text-white/80 text-lg">
            Gestiona tu información personal y configuración de cuenta
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto p-6 -mt-4">
        <div className="space-y-8">
          
          {/* Formulario de Perfil */}
          <div 
            className="p-8 transition-all duration-300"
            style={getCardStyles(isDark)}
          >
            <div className="flex items-center gap-3 mb-8">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${COLORS.primary}20` }}
              >
                <UserCheck className="w-5 h-5" style={{ color: COLORS.primary }} />
              </div>
              <h2 
                className="text-2xl font-bold"
                style={{ color: isDark ? '#f9fafb' : COLORS.dark }}
              >
                Información Personal
              </h2>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Nombre Completo */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: COLORS.primary }} />
                    <label 
                      htmlFor="fullName"
                      className="text-sm font-medium"
                      style={{ color: isDark ? '#e5e7eb' : COLORS.dark }}
                    >
                      Nombre Completo
                    </label>
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    id="fullName"
                    value={profileData.fullName}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 focus:outline-none focus:ring-2 transition-all"
                    style={{
                      ...getInputStyles(isDark),
                      '--tw-ring-color': '#014ba0'
                    }}
                    placeholder="Ingresa tu nombre completo"
                    required
                  />
                </div>

                {/* Fecha de Nacimiento */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: COLORS.primary }} />
                    <label 
                      htmlFor="fechaNacimiento"
                      className="text-sm font-medium"
                      style={{ color: isDark ? '#e5e7eb' : COLORS.dark }}
                    >
                      Fecha de Nacimiento
                    </label>
                  </div>
                  <input
                    type="date"
                    name="fechaNacimiento"
                    id="fechaNacimiento"
                    value={profileData.fechaNacimiento}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 focus:outline-none focus:ring-2 transition-all"
                    style={getInputStyles(isDark)}
                  />
                </div>

                {/* Sexo */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" style={{ color: COLORS.primary }} />
                    <label 
                      htmlFor="sexo"
                      className="text-sm font-medium"
                      style={{ color: isDark ? '#e5e7eb' : COLORS.dark }}
                    >
                      Sexo
                    </label>
                  </div>
                  <select
                    name="sexo"
                    id="sexo"
                    value={profileData.sexo}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 focus:outline-none focus:ring-2 transition-all"
                    style={getInputStyles(isDark)}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                  </select>
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" style={{ color: COLORS.primary }} />
                    <label 
                      htmlFor="telefono"
                      className="text-sm font-medium"
                      style={{ color: isDark ? '#e5e7eb' : COLORS.dark }}
                    >
                      Teléfono
                    </label>
                  </div>
                  <input
                    type="tel"
                    name="telefono"
                    id="telefono"
                    value={profileData.telefono}
                    onChange={handleProfileChange}
                    placeholder="+591..."
                    className="w-full px-4 py-3 focus:outline-none focus:ring-2 transition-all"
                    style={getInputStyles(isDark)}
                  />
                </div>

                {/* Universidad */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" style={{ color: COLORS.primary }} />
                    <label 
                      htmlFor="universidad"
                      className="text-sm font-medium"
                      style={{ color: isDark ? '#e5e7eb' : COLORS.dark }}
                    >
                      Universidad
                    </label>
                  </div>
                  <input
                    type="text"
                    name="universidad"
                    id="universidad"
                    value={profileData.universidad}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 focus:outline-none focus:ring-2 transition-all"
                    style={getInputStyles(isDark)}
                    placeholder="Nombre de tu universidad"
                  />
                </div>

                {/* Profesión */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" style={{ color: COLORS.primary }} />
                    <label 
                      htmlFor="profesion"
                      className="text-sm font-medium"
                      style={{ color: isDark ? '#e5e7eb' : COLORS.dark }}
                    >
                      Profesión / Cargo
                    </label>
                  </div>
                  <input
                    type="text"
                    name="profesion"
                    id="profesion"
                    value={profileData.profesion}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 focus:outline-none focus:ring-2 transition-all"
                    style={getInputStyles(isDark)}
                    placeholder="Tu profesión o cargo actual"
                  />
                </div>

                {/* Fecha de Examen - NUEVO CAMPO */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" style={{ color: COLORS.primary }} />
                    <label 
                      htmlFor="fechaExamen"
                      className="text-sm font-medium"
                      style={{ color: isDark ? '#e5e7eb' : COLORS.dark }}
                    >
                      Fecha de Examen
                    </label>
                  </div>
                  <input
                    type="date"
                    name="fechaExamen"
                    id="fechaExamen"
                    value={profileData.fechaExamen}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 focus:outline-none focus:ring-2 transition-all"
                    style={getInputStyles(isDark)}
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  type="submit" 
                  disabled={loadingProfile}
                  className="inline-flex items-center gap-3 px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100"
                  style={{ 
                    backgroundColor: COLORS.primary,
                    boxShadow: `0 8px 25px ${COLORS.primary}30`
                  }}
                >
                  {loadingProfile ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Formulario de Cambio de Contraseña */}
          <div 
            className="p-8 transition-all duration-300"
            style={getCardStyles(isDark)}
          >
            <div className="flex items-center gap-3 mb-8">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${COLORS.accent}20` }}
              >
                <Lock className="w-5 h-5" style={{ color: COLORS.accent }} />
              </div>
              <h2 
                className="text-2xl font-bold"
                style={{ color: isDark ? '#f9fafb' : COLORS.dark }}
              >
                Cambiar Contraseña
              </h2>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="space-y-6 max-w-md">
                
                {/* Nueva Contraseña */}
                <div className="space-y-2">
                  <label 
                    htmlFor="newPassword"
                    className="text-sm font-medium"
                    style={{ color: isDark ? '#e5e7eb' : COLORS.dark }}
                  >
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      name="newPassword"
                      id="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 pr-12 focus:outline-none focus:ring-2 transition-all"
                      style={getInputStyles(isDark)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      style={{ color: COLORS.primary }}
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Nueva Contraseña */}
                <div className="space-y-2">
                  <label 
                    htmlFor="confirmNewPassword"
                    className="text-sm font-medium"
                    style={{ color: isDark ? '#e5e7eb' : COLORS.dark }}
                  >
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      name="confirmNewPassword"
                      id="confirmNewPassword"
                      value={passwordData.confirmNewPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 pr-12 focus:outline-none focus:ring-2 transition-all"
                      style={getInputStyles(isDark)}
                      placeholder="Repite la nueva contraseña"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      style={{ color: COLORS.primary }}
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  type="submit" 
                  disabled={loadingPassword}
                  className="inline-flex items-center gap-3 px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100"
                  style={{ 
                    backgroundColor: COLORS.accent,
                    boxShadow: `0 8px 25px ${COLORS.accent}30`
                  }}
                >
                  {loadingPassword ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Cambiando...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Cambiar Contraseña
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}