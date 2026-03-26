"use client";
import React from 'react';
import { 
  X, 
  Activity, 
  TrendingUp, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye,
  AlertCircle,
  Zap,
  Award
} from 'lucide-react';

export default function CardRadiographyModal({ isOpen, onClose, card, isDark }) {
  if (!isOpen || !card) return null;

  // Cálculos de métricas
  const total = card.totalVistas || 0;
  const aciertos = card.totalAciertos || 0;
  const fallos = card.totalFallos || 0;
  const successRate = total > 0 ? Math.round((aciertos / total) * 100) : 0;
  
  // Formateo de fechas
  const formatDate = (timestamp) => {
    if (!timestamp) return "Nunca";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const timeAgo = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "Hace un momento";
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
    return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
  };

  const isPending = card.nextReview ? (card.nextReview.toDate ? card.nextReview.toDate() <= new Date() : new Date(card.nextReview) <= new Date()) : true;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
      <div 
        className={`relative w-full max-w-2xl rounded-[2rem] shadow-[0_30px_100px_-15px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 border-2 flex flex-col max-h-[90vh] ${
          isDark ? 'bg-[#1a2639] border-gray-700 text-white' : 'bg-white border-blue-50 text-[#2E4A70]'
        }`}
      >
        {/* Cabecera / Banner - Fija */}
        <div className={`p-8 sm:p-10 relative overflow-hidden flex-shrink-0 ${isDark ? 'bg-gray-800/50' : 'bg-[#2E4A70]/5'}`}>
          <button 
            onClick={onClose}
            className={`absolute top-6 right-6 p-3 rounded-full transition-all hover:rotate-90 z-30 ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-blue-100 text-[#2E4A70]'
            }`}
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 mb-6 relative z-20">
            <div className={`p-3 rounded-2xl ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-[#2E4A70] text-white shadow-xl shadow-blue-900/20'}`}>
              <Activity className="w-6 h-6" />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDark ? 'text-blue-400' : 'text-[#2E4A70]'}`}>
              Radiografía de Tarjeta
            </span>
            {card.isMastered && (
              <div className="flex items-center gap-1.5 bg-green-500/10 text-green-500 px-4 py-1.5 rounded-full border border-green-500/20">
                <Award className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Dominada</span>
              </div>
            )}
          </div>

          <h2 className={`font-black leading-tight tracking-tight mb-4 whitespace-normal break-words relative z-20 ${isDark ? 'text-white' : 'text-[#2E4A70] text-xl sm:text-2xl'}`}>
            {card.pregunta}
          </h2>
          <div className="flex items-center gap-2 relative z-20">
            <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[10px] font-black uppercase tracking-widest">
              {card.subtema}
            </span>
          </div>
          
          {/* Decoración de fondo en cabecera */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full transition-all duration-500"></div>
        </div>

        {/* Cuerpo del Reporte - Scrollable */}
        <div className="p-8 sm:p-10 pt-4 space-y-10 overflow-y-auto custom-scrollbar flex-grow">
          
          {/* Fila 1: KPI Principal y Tasa de Éxito */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* Gráfico Circular de Dominio */}
            <div className={`p-6 sm:p-8 rounded-[2rem] border flex items-center gap-6 ${isDark ? 'bg-gray-900/40 border-gray-800' : 'bg-gray-50 border-gray-100 shadow-inner'}`}>
              <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className={isDark ? "stroke-gray-800" : "stroke-gray-200"}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3"
                  />
                  <path
                    className="stroke-green-500 transition-all duration-1000 ease-out"
                    strokeDasharray={`${successRate}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl sm:text-2xl font-black leading-none">{successRate}%</span>
                  <span className="text-[8px] sm:text-[10px] font-black uppercase opacity-40">Éxito</span>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Estado Académico</h4>
                <div className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-black text-[9px] sm:text-[10px] border ${
                  isPending 
                    ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                }`}>
                  {isPending ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  {isPending ? 'PENDIENTE HOY' : 'EN PROGRAMACIÓN'}
                </div>
              </div>
            </div>

            {/* Próximo Repaso */}
            <div className={`p-6 sm:p-8 rounded-[2rem] border flex flex-col justify-center ${isDark ? 'bg-gray-900/40 border-gray-800' : 'bg-gray-50 border-gray-100 shadow-inner'}`}>
              <div className="flex items-center gap-2 opacity-40 mb-3 sm:mb-4">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Próxima Revisión</span>
              </div>
              <p className="text-lg sm:text-xl font-black">{formatDate(card.nextReview)}</p>
              <p className={`text-[9px] sm:text-[10px] font-bold mt-2 uppercase tracking-tighter ${isPending ? 'text-red-500' : 'text-blue-500'}`}>
                {isPending ? '¡Requiere atención inmediata!' : 'Mantén tu racha de estudio constante.'}
              </p>
            </div>
          </div>

          {/* Fila 2: Contadores Crudos */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            <div className={`p-4 sm:p-6 rounded-[2rem] border-2 text-center transition-all hover:scale-105 ${isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-blue-50 shadow-sm'}`}>
              <Eye className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 sm:mb-3 text-blue-500 opacity-60" />
              <div className="text-2xl sm:text-3xl font-black mb-1">{total}</div>
              <div className="text-[8px] sm:text-[10px] font-black uppercase opacity-40 tracking-widest">Vistas</div>
            </div>
            <div className={`p-4 sm:p-6 rounded-[2rem] border-2 text-center transition-all hover:scale-105 ${isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-blue-50 shadow-sm'}`}>
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 sm:mb-3 text-green-600 opacity-60" />
              <div className="text-2xl sm:text-3xl font-black text-green-600 mb-1">{aciertos}</div>
              <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-green-600">Éxitos</div>
            </div>
            <div className={`p-4 sm:p-6 rounded-[2rem] border-2 text-center transition-all hover:scale-105 ${isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-blue-50 shadow-sm'}`}>
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 sm:mb-3 text-red-500 opacity-60" />
              <div className="text-2xl sm:text-3xl font-black text-red-500 mb-1">{fallos}</div>
              <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-red-500">Fallos</div>
            </div>
          </div>

          {/* Fila 3: Historial y Detalles */}
          <div className={`p-6 sm:p-8 rounded-[2rem] border-2 ${isDark ? 'bg-gray-900/60 border-gray-800' : 'bg-blue-50/30 border-blue-100'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Historial Reciente</h4>
              </div>
              <span className={`text-[9px] sm:text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg w-fit ${isDark ? 'bg-[#2E4A70] text-white shadow-blue-900/20' : 'bg-[#2E4A70] text-white'}`}>
                ÚLTIMO REPASO: {timeAgo(card.lastUpdated)}
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs sm:text-sm gap-4">
                <span className="font-bold opacity-60 italic">Fecha del último registro:</span>
                <span className={`font-black text-right ${isDark ? 'text-white' : 'text-[#2E4A70]'}`}>{formatDate(card.lastUpdated)}</span>
              </div>
              <div className="w-full h-2 bg-gray-200/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-[#2E4A70] transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                  style={{ width: `${successRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Pie de Modal - Interno al Scroll si es muy largo */}
          <div className="pt-4 pb-2">
            <button 
              onClick={onClose}
              className={`w-full py-5 sm:py-6 rounded-full font-black text-sm uppercase tracking-[0.3em] transition-all active:scale-95 shadow-2xl ${
                isDark 
                  ? 'bg-blue-600 text-white shadow-blue-900/20 hover:bg-blue-700' 
                  : 'bg-[#2E4A70] text-white shadow-blue-900/20 hover:bg-[#1a2e4a]'
              }`}
            >
              Finalizar Análisis
            </button>
          </div>

        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 10px; }
      `}</style>
    </div>
  );
}
