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
    const matchLevel = level === 'Todos' || c.level === level;
    return matchSearch && matchLevel;
  });

  return (
    <div className="min-h-screen bg-[#F9F5F0]">
      <div className="bg-[#F5EFE6] py-12 px-4 border-b border-[#EDE4D6]">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-[#3D2B1F] mb-2">Todos los cursos</h1>
          <p className="text-[#A08060] mb-6">Encontrá el curso perfecto para vos</p>

          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A08060]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cursos..."
              className="w-full pl-10 pr-4 py-2.5 border border-[#EDE4D6] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9E7E] bg-white"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-8 flex-wrap">
          {levels.map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                level === l
                  ? 'bg-[#7A9E7E] text-white'
                  : 'bg-white text-[#6B4C3B] border border-[#EDE4D6] hover:border-[#7A9E7E]'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl">🔍</span>
            <p className="text-[#A08060] mt-4">No encontramos cursos con esa búsqueda.</p>
            <button onClick={() => { setSearch(''); setLevel('Todos'); }} className="mt-3 text-[#7A9E7E] text-sm hover:text-[#5E8262]">
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <p className="text-[#A08060] text-sm mb-5">{filtered.length} curso{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
