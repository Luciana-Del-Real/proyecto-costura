import { useState } from 'react';

// Patrones gratis para descargar. Cada patrón apunta a un PDF en
// /patrones/<archivo>.pdf (public/patrones/). Para agregar uno nuevo:
// 1) Copiá el PDF a costura-app/public/patrones/
// 2) Agregá una entrada a esta lista con su archivo, título y descripción.
const patrones = [
  {
    id: 1,
    titulo: 'Tote bag reversible',
    descripcion: 'Patrón en tamaño real para armar tu primer tote bag. Incluye guía de corte y costura paso a paso.',
    nivel: 'Principiante',
    categoria: 'Accesorios',
    archivo: '/patrones/tote-bag.pdf',
    color: 'bg-primary-soft',
  },
  {
    id: 2,
    titulo: 'Neceser con cremallera',
    descripcion: 'Patrón clásico de neceser con forrería y cremallera. Medidas y margen de costura incluidos.',
    nivel: 'Intermedio',
    categoria: 'Accesorios',
    archivo: '/patrones/neceser.pdf',
    color: 'bg-accent-soft',
  },
  {
    id: 3,
    titulo: 'Falda elástico',
    descripcion: 'Patrón de falda con cintura elástica, sin cremallera. Tallas S a XL con tabla de medidas.',
    nivel: 'Principiante',
    categoria: 'Indumentaria',
    archivo: '/patrones/falda-elastico.pdf',
    color: 'bg-primary-soft',
  },
  {
    id: 4,
    titulo: 'Delantal de cocina',
    descripcion: 'Delantal práctico con bolsillo frontal y tiras ajustables. Patrón en tamaño real listo para imprimir.',
    nivel: 'Principiante',
    categoria: 'Hogar',
    archivo: '/patrones/delantal.pdf',
    color: 'bg-accent-soft',
  },
  {
    id: 5,
    titulo: 'Funda de almohadón',
    descripcion: 'Funda de almohadón 40x40 con cierre escondido. Patrón simple con explicación de dobladillos.',
    nivel: 'Principiante',
    categoria: 'Hogar',
    archivo: '/patrones/funda-almohadon.pdf',
    color: 'bg-primary-soft',
  },
  {
    id: 6,
    titulo: 'Top de verano',
    descripcion: 'Top escotado con frunces, elástico en el busto. Tallas S a XL con guía de escalado.',
    nivel: 'Intermedio',
    categoria: 'Indumentaria',
    archivo: '/patrones/top-verano.pdf',
    color: 'bg-accent-soft',
  },
];

const niveles = ['Todos', 'Principiante', 'Intermedio', 'Avanzado'];

export default function PatronesGratis() {
  const [nivel, setNivel] = useState('Todos');

  const filtered = nivel === 'Todos'
    ? patrones
    : patrones.filter(p => p.nivel === nivel);

  return (
    <div className="max-w-6xl mx-auto px-1 py-1 animate-fade-in">
      {/* Banner principal */}
      <div className="bg-white rounded-2xl border-2 border-primary shadow-md px-4 py-10 animate-fade-up mt-5 mb-5">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-text-ink mb-2">Patrones gratis</h1>
          <p className="text-text-muted">Descargá patrones en PDF para coser en casa, paso a paso</p>
        </div>
      </div>

      {/* Filtro por nivel */}
      <div className="max-w-6xl mx-auto px-1 mt-6 mb-8 flex flex-wrap gap-3">
        {niveles.map(n => (
          <button
            key={n}
            onClick={() => setNivel(n)}
            className={`btn text-sm tracking-wide transition-all duration-300 shadow-sm ${
              nivel === n
                ? 'btn-primary shadow-md scale-105'
                : 'btn-ghost border border-primary/30 hover:border-primary'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Galería de patrones */}
      <div className="max-w-6xl mx-auto px-1 pb-16">
        {filtered.length === 0 ? (
          <div className="text-center py-16 card-glow rounded-2xl">
            <span className="text-5xl">📄</span>
            <p className="text-text-muted mt-4">Todavía no hay patrones de ese nivel.</p>
          </div>
        ) : (
          <>
            <p className="text-text-muted text-sm mb-6 font-medium pl-1">
              {filtered.length} patrón{filtered.length !== 1 ? 'es' : ''} disponible{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((p, index) => (
                <div key={p.id} className={`animate-stagger delay-${(index % 6) + 1}`}>
                  <div className="card-glow rounded-2xl p-6 h-full flex flex-col">
                    {/* Vista previa tipo documento */}
                    <div className={`${p.color} rounded-xl h-36 flex items-center justify-center mb-4`}>
                      <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-soft text-primary">{p.nivel}</span>
                      <span className="text-xs text-text-muted">{p.categoria}</span>
                    </div>

                    <h3 className="font-display text-2xl font-bold text-text-ink mb-2 leading-tight">{p.titulo}</h3>
                    <p className="text-text-ink text-sm leading-relaxed mb-4 flex-1">{p.descripcion}</p>

                    <a
                      href={p.archivo}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary w-full text-sm"
                    >
                      Descargar PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}