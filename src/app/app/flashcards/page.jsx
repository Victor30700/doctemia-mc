"use client";
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';

import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { getFlashcardMetrics, restoreMasteredFlashcards, getMasteredCount } from '@/lib/flashcardServices';
import { 
  BookOpen, 
  ChevronRight, 
  Layers, 
  GraduationCap, 
  Search,
  Loader2,
  Sparkles,
  ArrowRightCircle,
  Calendar,
  Zap,
  Activity,
  AlertTriangle,
  RotateCcw,
  TrendingUp,
  Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import CardRadiographyModal from './components/CardRadiographyModal';

export default function StudentFlashcardsPage() {
  const { isDark, isLoaded } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [subthemes, setSubthemes] = useState([]);
  const [globalCounts, setGlobalCounts] = useState({}); // Nuevo: Almacena conteos globales
  const [masteredCounts, setMasteredCounts] = useState({}); // Nuevo: Conteos de dominadas por subtema
  const [loading, setLoading] = useState(true);
  const [loadingSub, setLoadingSub] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [metrics, setMetrics] = useState({ 
    dueToday: 0, 
    totalLearning: 0, 
    performanceBySubtheme: [],
    criticalCards: []
  });
  const [criticalQuestions, setCriticalQuestions] = useState({}); // Mapeo ID -> Texto Pregunta
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  
  // Estado para la Radiografía
  const [selectedCardForRadiography, setSelectedCardForRadiography] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Obtener todas las categorías (Especialidades)
        const q = query(collection(db, 'course_categories'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        const allCategories = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 2. Obtener todas las flashcards para identificar especialidades "activas"
        // Consultamos solo lo necesario para el filtrado
        const flashcardsRef = collection(db, 'flashcards');
        const flashSnap = await getDocs(flashcardsRef);
        
        const activeCatIds = new Set();
        const counts = {};

        flashSnap.forEach(doc => {
          const data = doc.data();
          const catId = data.especialidad;
          // Validación robusta: asegurar que subtema existe y es string antes de trim
          const subName = (data.subtema && typeof data.subtema === 'string') ? data.subtema.trim() : null;

          if (catId) activeCatIds.add(catId);
          if (subName) {
            counts[subName] = (counts[subName] || 0) + 1;
          }
        });

        // 3. Filtrar: Solo especialidades que tienen al menos 1 tarjeta
        const filtered = allCategories.filter(cat => activeCatIds.has(cat.id));
        
        setCategories(filtered);
        setGlobalCounts(counts); // Guardamos conteos para uso inmediato
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserMetrics = async () => {
      if (!user) return;
      setLoadingMetrics(true);
      try {
        const stats = await getFlashcardMetrics(user.uid);
        setMetrics(stats);

        // Fetch questions for critical cards
        if (stats.criticalCards.length > 0) {
          const questions = {};
          for (const card of stats.criticalCards) {
            const cardDoc = await getDocs(query(collection(db, 'flashcards'), where('__name__', '==', card.id)));
            if (!cardDoc.empty) {
              questions[card.id] = cardDoc.docs[0].data().pregunta;
            }
          }
          setCriticalQuestions(questions);
        }
      } catch (error) {
        console.error("Error fetching metrics:", error);
      } finally {
        setLoadingMetrics(false);
      }
    };

    fetchData();
    fetchUserMetrics();
  }, [user]);

  const handleSelectCategory = async (cat) => {
    setSelectedCat(cat);
    setLoadingSub(true);
    try {
      // 1. Obtener subtemas de la especialidad seleccionada
      const subRef = collection(db, 'course_categories', cat.id, 'subcategories');
      const q = query(subRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const allSubthemes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 2. Obtener conteo de dominadas por subtema
      const mastered = {};
      for (const sub of allSubthemes) {
        if (sub.name) {
          mastered[sub.name.trim()] = await getMasteredCount(user.uid, sub.name.trim());
        }
      }
      setMasteredCounts(mastered);

      // 3. Cruzamos con los conteos globales que ya tenemos en memoria
      const activeSubthemes = allSubthemes
        .map(sub => ({
          ...sub,
          cardCount: globalCounts[sub.name?.trim()] || 0
        }))
        .filter(sub => sub.cardCount > 0); // Ocultar vacíos

      setSubthemes(activeSubthemes);
    } catch (error) {
      console.error("Error fetching subthemes:", error);
    } finally {
      setLoadingSub(false);
    }
  };

  const handleRestore = async (e, subtemaName) => {
    e.stopPropagation();
    try {
      await restoreMasteredFlashcards(user.uid, subtemaName);
      toast.success(`Tarjetas de ${subtemaName} restauradas.`);
      // Refrescar conteos
      const newCount = await getMasteredCount(user.uid, subtemaName);
      setMasteredCounts(prev => ({ ...prev, [subtemaName]: newCount }));
      
      // Refrescar métricas generales
      const stats = await getFlashcardMetrics(user.uid);
      setMetrics(stats);
    } catch (error) {
      console.error("Error restoring cards:", error);
      toast.error("No se pudieron restaurar las tarjetas.");
    }
  };

  const startStudy = (subtemaName) => {
    router.push(`/app/flashcards/estudio?subtema=${encodeURIComponent(subtemaName)}`);
  };

  if (!isLoaded) return null;

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`p-6 sm:p-10 min-h-screen transition-all duration-500 ${isDark ? 'bg-[#1a2639]' : 'bg-[#FDF9F1]'}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Cabecera Estilo Apple/Moderno */}
        <header className="mb-12 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-4">
            <div>
              <h1 className={`text-5xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-[#2E4A70]'}`}>
                Flashcards
              </h1>
              <p className={`text-xl font-medium opacity-60 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Repetición espaciada inteligente para dominar cada tema médico.
              </p>
            </div>
          </div>
        </header>

        {/* Dashboard de Métricas Analíticas Evolucionado */}
        <section className="mb-12 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Columna Izquierda: KPIs */}
            <div className="lg:col-span-4 space-y-8">
                {/* Tarjeta 1: Pendientes Hoy */}
                <div className={`p-8 rounded-[2rem] border shadow-2xl shadow-blue-500/5 transition-all hover:scale-[1.02] ${isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-blue-50'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <h3 className={`font-black text-sm uppercase tracking-widest opacity-60 ${isDark ? 'text-gray-300' : 'text-[#2E4A70]'}`}>Repasos para Hoy</h3>
                  </div>
                  {loadingMetrics ? (
                    <div className="h-10 w-20 bg-gray-200/20 animate-pulse rounded-lg"></div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className={`text-6xl font-black ${isDark ? 'text-white' : 'text-blue-600'}`}>{metrics.dueToday}</span>
                      <span className="text-sm font-black opacity-40 uppercase tracking-tighter">Tarjetas</span>
                    </div>
                  )}
                </div>

                {/* Tarjeta 2: Aprendizaje Activo */}
                <div className={`p-8 rounded-[2rem] border shadow-2xl shadow-blue-500/5 transition-all hover:scale-[1.02] ${isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-blue-50'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
                      <Target className="w-8 h-8" />
                    </div>
                    <h3 className={`font-black text-sm uppercase tracking-widest opacity-60 ${isDark ? 'text-gray-300' : 'text-[#2E4A70]'}`}>En Aprendizaje</h3>
                  </div>
                  {loadingMetrics ? (
                    <div className="h-10 w-20 bg-gray-200/20 animate-pulse rounded-lg"></div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className={`text-6xl font-black ${isDark ? 'text-white' : 'text-indigo-600'}`}>{metrics.totalLearning}</span>
                      <span className="text-sm font-black opacity-40 uppercase tracking-tighter">Temas</span>
                    </div>
                  )}
                </div>
            </div>

            {/* Columna Derecha: Gráfica de Rendimiento */}
            <div className="lg:col-span-8">
              <div className={`p-10 h-full rounded-[2rem] border shadow-2xl shadow-blue-500/5 ${isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-blue-50'}`}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className={`text-2xl font-black flex items-center gap-3 ${isDark ? 'text-white' : 'text-[#2E4A70]'}`}>
                    <TrendingUp className="w-6 h-6 text-green-500" /> Rendimiento por Especialidad
                  </h3>
                  <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Aciertos vs Fallos</span>
                </div>

                <div className="space-y-6 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                  {loadingMetrics ? (
                    [1,2,3].map(i => <div key={i} className="h-12 w-full bg-gray-200/10 animate-pulse rounded-xl"></div>)
                  ) : metrics.performanceBySubtheme.length === 0 ? (
                    <div className="text-center py-10 opacity-30 italic font-medium">No hay suficientes datos analíticos aún.</div>
                  ) : metrics.performanceBySubtheme.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-black truncate max-w-[200px]">{item.name}</span>
                        <span className={`text-xs font-black ${item.percentage > 70 ? 'text-green-500' : item.percentage > 40 ? 'text-orange-500' : 'text-red-500'}`}>
                          {item.percentage}% Dominio
                        </span>
                      </div>
                      <div className="w-full h-4 bg-gray-200/10 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000" 
                          style={{ width: `${item.percentage}%` }}
                        />
                        <div 
                          className="h-full bg-gradient-to-r from-orange-400 to-red-600 opacity-30 transition-all duration-1000" 
                          style={{ width: `${100 - item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Tarjetas Críticas - Layout Horizontal de Ancho Completo */}
          <div className={`w-full p-8 sm:p-10 rounded-[2rem] border shadow-xl animate-gradient-shift ${
            isDark 
              ? 'bg-gray-900/40 border-gray-800 shadow-gray-900/20' 
              : 'border-blue-900/20 bg-gradient-to-br from-[#1a2e4d] via-[#2E4A70] to-[#3b82f6] shadow-blue-500/20'
          }`}>
            <div className="text-center mb-10">
              <h3 className={`text-5xl font-bold mb-4 ${isDark ? 'bg-gradient-to-r from-[#2E4A70] to-[#3B82F6] bg-clip-text text-transparent' : 'text-white'}`}>
                Tus Tarjetas Críticas
              </h3>
              <p className={`text-xl max-w-2xl mx-auto mb-8 ${isDark ? 'text-gray-600' : 'text-blue-100/80'}`}>
                Conceptos que requieren refuerzo inmediato
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {loadingMetrics ? (
                [1,2,3].map(i => <div key={i} className="h-40 w-full bg-gray-100 animate-pulse rounded-[2rem]"></div>)
              ) : metrics.criticalCards.length === 0 ? (
                <div className="col-span-full py-12 flex flex-col items-center justify-center opacity-40 text-center">
                  <Activity className="w-12 h-12 mb-4 text-green-500" />
                  <p className={`text-lg font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-[#2E4A70]'}`}>¡Felicidades! No tienes debilidades críticas.</p>
                </div>
              ) : metrics.criticalCards.map((card, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedCardForRadiography({
                    ...card,
                    pregunta: criticalQuestions[card.id] || 'Cargando pregunta...'
                  })}
                  className={`group p-6 rounded-[2rem] border flex flex-col justify-between transition-all hover:shadow-2xl hover:scale-[1.02] cursor-pointer min-h-[180px] ${
                  isDark ? 'bg-gray-800 border-gray-700 hover:border-blue-500/50' : 'bg-white border-gray-100 shadow-sm hover:border-blue-200'
                }`}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                        {card.subtema}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-black bg-red-50 text-red-500 px-3 py-1 rounded-full border border-red-100">
                        {card.totalFallos} FALLOS
                      </span>
                    </div>
                    <p className={`text-lg font-black leading-tight line-clamp-3 ${isDark ? 'text-white' : 'text-[#2E4A70]'}`}>
                      "{criticalQuestions[card.id] || 'Cargando pregunta...'}"
                    </p>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-blue-500">Ver Radiografía</span>
                    <ArrowRightCircle className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* SELECCIÓN DE ESPECIALIDAD */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className={`p-8 rounded-[2rem] shadow-xl border transition-all ${
              isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100 shadow-gray-200/50'
            }`}>
              <div className="flex items-center justify-between mb-8">
                <h2 className={`text-2xl font-black flex items-center gap-3 ${isDark ? 'text-white' : 'text-[#2E4A70]'}`}>
                  <BookOpen className="w-6 h-6 text-blue-500" /> Especialidades
                </h2>
                <span className="text-[10px] font-black px-4 py-1.5 bg-blue-500/10 text-blue-500 rounded-full uppercase tracking-[0.2em]">Paso 1</span>
              </div>

              <div className="relative mb-8 group">
                <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                <input 
                  type="text" 
                  placeholder="Buscar área médica..." 
                  className={`w-full pl-14 pr-6 py-5 rounded-2xl text-lg border-2 outline-none transition-all ${
                    isDark 
                      ? 'bg-gray-900/50 border-gray-700 focus:border-blue-500 text-white' 
                      : 'bg-gray-50 border-gray-100 focus:border-blue-400 focus:bg-white text-[#2E4A70] shadow-inner'
                  }`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-3 custom-scrollbar">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
                    <p className="text-sm font-bold opacity-40 uppercase tracking-widest">Cargando...</p>
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div className="text-center py-20 opacity-30 italic font-medium">No se encontraron resultados.</div>
                ) : filteredCategories.map(cat => (
                  <div 
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat)}
                    className={`group flex items-center justify-between p-6 rounded-[2rem] cursor-pointer transition-all border-2 ${
                      selectedCat?.id === cat.id 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-2xl shadow-blue-600/40 translate-x-2' 
                        : isDark 
                          ? 'bg-gray-900/30 border-transparent hover:border-blue-500/50 hover:bg-gray-900/60' 
                          : 'bg-white border-transparent hover:border-blue-200 hover:shadow-2xl shadow-gray-200/20'
                    }`}
                  >
                    <span className="font-black text-xl">{cat.name}</span>
                    <div className={`p-2.5 rounded-xl transition-colors ${selectedCat?.id === cat.id ? 'bg-white/20' : 'bg-blue-500/5 group-hover:bg-blue-500 group-hover:text-white'}`}>
                      <ChevronRight className={`w-6 h-6 transition-transform ${selectedCat?.id === cat.id ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LISTA DE SUBTEMAS */}
          <div className="lg:col-span-8">
            <div className={`p-12 rounded-[2rem] shadow-xl border min-h-[650px] flex flex-col transition-all duration-500 ${
              isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100 shadow-gray-200/50'
            }`}>
              {selectedCat ? (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500 flex flex-col h-full">
                  <div className="mb-12">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] bg-blue-500/10 px-4 py-1.5 rounded-full">Área Seleccionada</span>
                    </div>
                    <h3 className={`text-5xl font-black tracking-tight leading-none mb-4 ${isDark ? 'text-white' : 'text-[#2E4A70]'}`}>{selectedCat.name}</h3>
                    <p className="text-xl opacity-50 font-medium italic">Elige un identificador de estudio para comenzar tu sesión.</p>
                  </div>

                  {loadingSub ? (
                    <div className="flex-grow flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="animate-spin text-blue-500 w-16 h-16" />
                      <p className="font-black text-sm uppercase tracking-widest opacity-40">Sincronizando banco de datos...</p>
                    </div>
                  ) : subthemes.length === 0 ? (
                    <div className="flex-grow flex flex-col items-center justify-center opacity-20 text-center py-20">
                      <Layers className="w-24 h-24 mb-6" />
                      <p className="text-3xl font-black uppercase tracking-tighter">Sin temas registrados</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-4 pb-6 overflow-y-auto max-h-[60vh] pr-4 custom-scrollbar">
                      {subthemes.map(sub => (
                        <div 
                          key={sub.id}
                          onClick={() => startStudy(sub.name)}
                          className={`flex-grow sm:flex-grow-0 basis-full sm:basis-[calc(50%-1rem)] lg:basis-[calc(33.33%-1rem)] flex flex-col p-6 rounded-[2rem] border-2 text-left transition-all hover:scale-[1.03] active:scale-95 group relative overflow-hidden h-fit cursor-pointer ${
                            isDark 
                              ? 'bg-gray-900/40 border-gray-700 hover:border-blue-500 hover:shadow-2xl shadow-blue-500/10' 
                              : 'bg-gray-50 border-gray-100 hover:border-blue-400 hover:bg-white hover:shadow-2xl shadow-blue-100/10'
                          }`}
                        >
                          <div className="flex items-start justify-between w-full mb-6 relative z-10">
                            <div className={`p-4 rounded-2xl shadow-lg transition-all duration-300 ${
                              isDark ? 'bg-gray-800' : 'bg-white'
                            } group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-12`}>
                              <GraduationCap className="w-8 h-8" />
                            </div>
                            <div className="flex items-center gap-2 font-black text-[10px] text-blue-500 bg-blue-500/10 px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-all translate-y-[-10px] group-hover:translate-y-0">
                              ESTUDIAR <ArrowRightCircle className="w-4 h-4" />
                            </div>
                          </div>

                          <div className="relative z-10">
                            <h4 className="font-black text-xl block leading-snug mb-3 group-hover:text-blue-600 transition-colors whitespace-normal break-words">
                              {sub.name}
                            </h4>
                            <div className="flex items-center justify-between w-full flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded-full font-black shadow-lg shadow-blue-500/10">
                                  {sub.cardCount} TARJETAS
                                </span>
                              </div>
                              
                              {/* Botón Restaurar (Solo si hay dominadas) - Refactorizado como Ghost Button */}
                              {masteredCounts[sub.name?.trim()] > 0 && (
                                <button
                                  onClick={(e) => handleRestore(e, sub.name.trim())}
                                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-2 transition-all hover:scale-105 active:scale-95 z-20 font-black text-[9px] uppercase tracking-tighter ${
                                    isDark 
                                      ? 'border-gray-700 bg-transparent text-gray-400 hover:border-blue-500 hover:text-white' 
                                      : 'border-gray-200 bg-transparent text-gray-500 hover:border-blue-500 hover:text-blue-600'
                                  }`}
                                  title="Restaurar tarjetas dominadas"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>{masteredCounts[sub.name?.trim()]}</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Decoración de fondo */}
                          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full transition-all duration-500 group-hover:scale-150 group-hover:bg-blue-500/10"></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center opacity-40 animate-pulse">
                  <div className="w-32 h-32 bg-blue-500/10 rounded-full flex items-center justify-center mb-8 border-4 border-dashed border-blue-500/20">
                    <Sparkles className="w-16 h-16 text-blue-500" />
                  </div>
                  <p className="text-2xl font-black max-w-xs leading-tight uppercase tracking-tighter text-[#2E4A70]">
                    Elige una especialidad para desbloquear tus temas
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Modal de Radiografía */}
        <CardRadiographyModal 
          isOpen={!!selectedCardForRadiography}
          onClose={() => setSelectedCardForRadiography(null)}
          card={selectedCardForRadiography}
          isDark={isDark}
        />
      </div>

      <style jsx global>{`
        @keyframes gradientAnimation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-shift {
          background-size: 400% 400%;
          animation: gradientAnimation 15s ease infinite;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDark ? '#374151' : '#d1d5db'}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDark ? '#4b5563' : '#9ca3af'}; }
      `}</style>
    </div>
  );
}