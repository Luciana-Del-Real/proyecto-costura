import { useState } from 'react';
import { Search } from 'lucide-react';
import { useCourseCatalog } from '../context/CourseCatalogContext';
import CourseCard from '../components/CourseCard';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import SearchInput from '../components/SearchInput';

const levels = ['Todos', 'Principiante', 'Intermedio', 'Avanzado'];

export default function Courses() {
  const { courses, loading } = useCourseCatalog();
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
    <div className="w-full px-4 py-1 animate-fade-in">
      <PageHeader title="Todos los cursos" subtitle="Encontrá el curso perfecto para vos" />

      {/* CONTENEDOR UNIFICADO: Agregamos mt-6 para controlar la distancia exacta con el texto */}
      <div className="w-full px-4 mt-6 mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
        <SearchInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar cursos..."
          className="w-full md:w-72 group"
        />
      </div>

      {/* Contenedor del listado de cursos */}
      <div className="w-full px-4 pb-16">
        {loading ? (
          <LoadingState size="section" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Sin resultados para tu búsqueda."
            action={{ label: 'Limpiar búsqueda', onClick: () => { setSearch(''); setLevel('Todos'); }, variant: 'ghost' }}
          />
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