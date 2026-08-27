import { useState } from 'react';
import { Search } from 'lucide-react';
import { useCourseCatalog } from '../context/CourseCatalogContext';
import CourseCard from '../components/CourseCard';
import PageHeader from '../components/PageHeader';

const levels = ['Todos', 'Principiante', 'Intermedio', 'Avanzado'];

export default function Courses() {
  const { courses } = useCourseCatalog();
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
      <PageHeader title="Todos los cursos" subtitle="Encontrá el curso perfecto para vos" />

      {/* CONTENEDOR UNIFICADO: Agregamos mt-6 para controlar la distancia exacta con el texto */}
      <div className="max-w-6xl mx-auto px-1 mt-6 mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Filtros por Nivel */}
        <div className="flex flex-wrap gap-3">
          {levels.map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`btn text-sm tracking-wide transition-all duration-300 shadow-sm ${
                level === l
                  ? 'btn-primary shadow-md scale-105'
                  : 'btn-ghost border border-primary/30 hover:border-primary'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Buscador compacto integrado */}
        <div className="relative w-full md:w-72 group">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cursos..."
            className="w-full pl-10 pr-4 py-2 text-sm border-2 border-gray-300 hover:border-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white text-gray-700 placeholder-gray-400 shadow-sm transition-all duration-300"
          />
        </div>
      </div>

      {/* Contenedor del listado de cursos */}
      <div className="max-w-6xl mx-auto px-1 pb-16">
        {filtered.length === 0 ? (
          <div className="text-center py-16 card-flat rounded-2xl">
            <Search className="w-12 h-12 text-primary mx-auto" strokeWidth={1.5} />
            <h2 className="font-display font-bold text-text-ink text-2xl mt-4">No encontramos cursos con esa búsqueda.</h2>
            <button 
              onClick={() => { setSearch(''); setLevel('Todos'); }} 
              className="btn btn-ghost mt-3 text-sm text-primary hover:text-primary-hover"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <p className="text-text-muted text-sm mb-6 font-medium pl-1">
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