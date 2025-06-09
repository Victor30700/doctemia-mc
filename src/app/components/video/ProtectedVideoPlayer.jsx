// src/app/components/video/ProtectedVideoPlayer.jsx
import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player/youtube';
import Swal from 'sweetalert2';

const ProtectedVideoPlayer = ({ url, width = "100%", height = "100%", onProgress, onDuration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  const showSecurityWarning = (message = 'Este contenido está protegido y la acción ha sido bloqueada.') => {
    Swal.fire({
      title: 'Contenido Protegido',
      text: message,
      icon: 'warning',
      timer: 3000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  useEffect(() => {
    const disableContextMenu = (e) => {
      e.preventDefault();
      showSecurityWarning('El menú contextual ha sido deshabilitado.');
      return false;
    };

    const disableKeyboardShortcuts = (e) => {
      const key = e.key.toUpperCase();
      const ctrl = e.ctrlKey;
      const shift = e.shiftKey;

      if (key === 'ESCAPE' && document.fullscreenElement) {
        return; // Permitir ESC para salir de pantalla completa
      }

      if (key === 'F12' || (ctrl && shift && (key === 'I' || key === 'J' || key === 'C'))) {
        e.preventDefault();
        showSecurityWarning('Las herramientas de desarrollo están bloqueadas.');
        return false;
      }
      if (ctrl && key === 'U') {
        e.preventDefault();
        showSecurityWarning('Ver el código fuente está bloqueado.');
        return false;
      }
      if (ctrl && key === 'S') {
        e.preventDefault();
        showSecurityWarning('Guardar la página está bloqueado.');
        return false;
      }
      if (ctrl && key === 'P') {
        e.preventDefault();
        showSecurityWarning('Imprimir la página está bloqueado.');
        return false;
      }
    };

    const disableSelection = (e) => e.preventDefault();
    const disableDragStart = (e) => e.preventDefault();

    document.addEventListener('contextmenu', disableContextMenu);
    document.addEventListener('keydown', disableKeyboardShortcuts);
    document.addEventListener('selectstart', disableSelection);
    document.addEventListener('dragstart', disableDragStart);

    const detectDevTools = () => {
      if (document.fullscreenElement) return;
      const threshold = 160;
      if (window.outerHeight - window.innerHeight > threshold ||
          window.outerWidth - window.innerWidth > threshold) {
        console.clear();
        console.log('%cAcceso restringido detectado.', 'color: red; font-size: 20px; font-weight: bold;');
        showSecurityWarning('Herramientas de desarrollo detectadas. Funcionalidad restringida.');
      }
    };

    const interval = setInterval(detectDevTools, 1500);

    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange); // Safari
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);    // Firefox
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);     // IE/Edge

    return () => {
      document.removeEventListener('contextmenu', disableContextMenu);
      document.removeEventListener('keydown', disableKeyboardShortcuts);
      document.removeEventListener('selectstart', disableSelection);
      document.removeEventListener('dragstart', disableDragStart);
      clearInterval(interval);
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
    };
  }, []);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleProgress = (state) => {
    setPlayed(state.played);
    if (onProgress) onProgress(state);
  };

  const handleDuration = (newDuration) => {
    setDuration(newDuration);
    if (onDuration) onDuration(newDuration);
  };

  const handleSeek = (e) => {
    const progressBar = e.currentTarget;
    if (!progressBar || !playerRef.current) return;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekTo = Math.max(0, Math.min(1, clickX / rect.width));
    playerRef.current.seekTo(seekTo, 'fraction');
    setPlayed(seekTo);
  };
  
  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setMuted(!muted);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === Infinity || seconds < 0) return '0:00';
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement && 
        !document.mozFullScreenElement && // Firefox
        !document.webkitFullscreenElement && // Chrome, Safari, Opera
        !document.msFullscreenElement) { // IE/Edge
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(err => console.error("Error full-screen:", err));
      } else if (containerRef.current.mozRequestFullScreen) { // Firefox
        containerRef.current.mozRequestFullScreen();
      } else if (containerRef.current.webkitRequestFullscreen) { // Chrome, Safari, Opera
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) { // IE/Edge
        containerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) { // Firefox
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) { // Chrome, Safari, Opera
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { // IE/Edge
        document.msExitFullscreen();
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black rounded-lg overflow-hidden group"
      style={{ 
        userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none'
      }}
    >
      <div 
        className="absolute inset-0 z-30"
        style={{ cursor: 'default' }}
        onContextMenu={(e) => e.preventDefault()}
        onClick={(e) => {
          if (playerRef.current && e.target === e.currentTarget) { 
            togglePlay();
          }
        }}
      />

      <ReactPlayer
        ref={playerRef}
        url={url}
        width="100%"
        height="100%"
        playing={isPlaying}
        volume={volume}
        muted={muted}
        onPlay={handlePlay}
        onPause={handlePause}
        onProgress={handleProgress}
        onDuration={handleDuration}
        controls={false}
        config={{
          youtube: {
            playerVars: {
              modestbranding: 1, rel: 0, showinfo: 0, controls: 0,
              disablekb: 1, fs: 0, iv_load_policy: 3, cc_load_policy: 0,
              playsinline: 1,
              origin: typeof window !== 'undefined' ? window.location.origin : ''
            }
          },
          file: {
            attributes: {
              controlsList: 'nodownload noplaybackrate',
              disablePictureInPicture: true,
            }
          }
        }}
        style={{
          pointerEvents: 'none'
        }}
      />

      <div 
        className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-3 pt-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        <div 
          className="w-full h-1.5 bg-gray-700/70 rounded cursor-pointer mb-2.5 relative group/progress"
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-red-500 rounded transition-all duration-[50ms]"
            style={{ width: `${played * 100}%` }}
          />
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity duration-200"
            style={{ left: `calc(${played * 100}% - 6px)` }}
          />
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <button onClick={togglePlay} className="p-1.5 hover:bg-white/20 rounded-full transition-colors" aria-label={isPlaying ? "Pausar" : "Reproducir"}>
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z"></path></svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.5 15.75V4.25L15.25 10L6.5 15.75z"></path></svg>
              )}
            </button>
            <span className="text-xs font-mono w-[90px]">{formatTime(played * duration)} / {formatTime(duration)}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={toggleMute} className="p-1.5 hover:bg-white/20 rounded-full transition-colors" aria-label={muted || volume === 0 ? "Activar sonido" : "Silenciar"}>
              {muted || volume === 0 ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13.143 11.49a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 01-1.061-1.06l1.06-1.06a.75.75 0 011.06 0zm2.121-2.121a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zm1.732.354a.75.75 0 01-.276 1.027l-1.268.732a.75.75 0 01-.276-1.027l1.268-.732a.75.75 0 011.052.276zM3.5 7.75A.75.75 0 002.75 7v1.5c0 .414.336.75.75.75H5l3.293 3.293a.75.75 0 001.207-.53V4.243a.75.75 0 00-1.207-.53L5 7H3.5v.75zm7.036-2.44A.75.75 0 0110 5.84v8.32a.75.75 0 01-1.5 0V5.84a.75.75 0 011.036-.707.753.753 0 01.464.707z"></path></svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.022 7.036A.75.75 0 015.75 7h-2a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h2a.75.75 0 01.272-.53l4.478-3.964a.75.75 0 000-1.016L6.022 7.566a.75.75 0 010-.53zm8.003 1.464a.75.75 0 01.95 1.082l-.002.001a4.502 4.502 0 010 4.834l.002.001a.75.75 0 11-.95 1.084l-.001-.001a6.002 6.002 0 000-6.418l.001-.001a.75.75 0 01.95-1.082zM11.75 6.75a.75.75 0 01.691 1.017A2.25 2.25 0 0111 10a2.25 2.25 0 011.441-2.233.75.75 0 011.017-.692A3.75 3.75 0 0011 10a3.75 3.75 0 00-2.708-3.616.75.75 0 11.375-1.403A5.25 5.25 0 0111 10c0 .64-.115 1.255-.33 1.826a.75.75 0 11-1.402-.434A3.733 3.733 0 0011.75 10a3.733 3.733 0 00-.208-1.164.75.75 0 01.666-1.086z"></path></svg>
              )}
            </button>
            <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
              onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
              className="w-16 h-1 bg-gray-600/70 rounded-lg appearance-none cursor-pointer slider"
              aria-label="Control de volumen"
            />
            {/* Botón de Pantalla Completa */}
            <button onClick={toggleFullScreen} className="p-1.5 hover:bg-white/20 rounded-full transition-colors" aria-label={isFullScreen ? "Salir de pantalla completa" : "Pantalla completa"}>
              {isFullScreen ? (
                // Icono para SALIR de pantalla completa (Encoger)
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M14 10h2V4h-2v2H8V4H6v6h2V8h4v2zm-2-4H8v2h4V6zM6 14v-2H4v6h6v-2H6v-2zm8 2v-2h2v2h-2zm-2 0H8v2h4v-2z" clipRule="evenodd"></path><path d="M6 2H2v5h2V4h2V2zm8 0V2h-5v2h2v2h2V2zM6 18v-2H4v-2H2v5h4v-1zm8-2h2v-2h2v5h-5v-2h1v-1z"></path></svg>
              ) : (
                // Icono para ENTRAR a pantalla completa (Expandir)
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v12H4V4zm2 2a1 1 0 00-1 1v2a1 1 0 102 0V7a1 1 0 00-1-1zm0 6a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1zm8-5a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zm0 6a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd"></path><path d="M4 8V4h4V2H3v6h2zm8-6v2h4v4h2V2h-6zM8 16H4v-4H2v6h6v-2zm8 2h-4v-2h4v-4h2v6h-2z"></path></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div 
        id="security-warning-overlay"
        className="absolute inset-0 z-50 bg-black/90 flex-col items-center justify-center text-white text-center p-8 hidden"
      >
        <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        <h3 className="text-2xl font-bold mb-2">Acceso Restringido</h3>
        <p className="text-lg">Se ha detectado actividad sospechosa. La reproducción puede ser limitada.</p>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none; -webkit-appearance: none;
          width: 12px; height: 12px; border-radius: 50%;
          background: #ef4444; cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 12px; height: 12px; border-radius: 50%;
          background: #ef4444; cursor: pointer; border: none;
        }
      `}</style>
    </div>
  );
};

export default ProtectedVideoPlayer;