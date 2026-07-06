import { useState } from 'react';
import { useCourses } from '../context/CoursesContext';
import CourseCard from '../components/CourseCard';

const levels = ['Todos', 'Principiante', 'Intermedio', 'Avanzado'];

export default function Courses() {
  const { courses } = useCourses();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('Todos');

  const filtered = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    
    // Normalizamos quitando acentos y pasando todo a minúsculas
    const normalizeText = (text) => 
      text ? text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

    const matchLevel = level === 'Todos' || normalizeText(c.level) === normalizeText(level);
    
    return matchSearch && matchLevel;
  });

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
      {/* CORREGIDO: Reducimos padding vertical (pt-10 pb-5) y quitamos mb-8 */}
      <div className="bg-[#F4F1ED] rounded-2xl shadow-sm border border-gray-100 px-4 py-10 animate-fade-up mt-5 mb-5">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-[#6B4C3B] mb-2">Todos los cursos</h1>
          <p className="text-gray-600">Encontrá el curso perfecto para vos</p>
        </div>
      </div>

      {/* CONTENEDOR UNIFICADO: Agregamos mt-6 para controlar la distancia exacta con el texto */}
      <div className="max-w-6xl mx-auto px-4 mt-6 mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Filtros por Nivel */}
        <div className="flex flex-wrap gap-3">
          {levels.map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-5 py-2 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 shadow-sm ${
                level === l
                  ? '!bg-[#4E6D5B] !text-white shadow-md scale-105'
                  : '!bg-white !text-[#4E6D5B] border border-[#4E6D5B]/30 hover:border-[#4E6D5B] hover:bg-[#FDF8FA]'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Buscador compacto integrado */}
        <div className="relative w-full md:w-72 group">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4E6D5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cursos..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#4E6D5B] bg-white text-gray-700 placeholder-gray-400 shadow-sm transition-all duration-300"
          />
        </div>
      </div>

      {/* Contenedor del listado de cursos */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-5xl">🔍</span>
            <p className="text-gray-500 mt-4">No encontramos cursos con esa búsqueda.</p>
            <button 
              onClick={() => { setSearch(''); setLevel('Todos'); }} 
              className="mt-3 text-[#4E6D5B] text-sm font-medium underline hover:text-[#3d5648]"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-6 font-medium pl-1">
              {filtered.length} curso{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            </p>
            {/* Grid dinámico responsivo fluido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filtered.map((course, index) => (
                <div 
                  key={course.id} 
                  className={`animate-stagger delay-${(index % 6) + 1}`}
                >
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 