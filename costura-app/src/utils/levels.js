// Mapeo de niveles: el backend guarda el enum en MAYÚSCULAS
// (PRINCIPIANTE|INTERMEDIO|AVANZADO), así que las claves se normalizan a
// minúsculas para que cada nivel válido muestre siempre su color correcto
// (nunca el gris por defecto). Niveles desconocidos caen en el fallback neutro.
// Escala rosa/fucsia de la identidad Grow: principiante suave → avanzado intenso.
const levelClasses = {
  principiante: 'bg-primary-soft text-primary', // Rosa pastel muy sutil
  intermedio: 'bg-secondary/40 text-primary-hover', // Rosa medio
  avanzado: 'bg-accent text-white', // Fucsia intenso (sólido)
};

const levelLabels = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

export function getLevelKey(level) {
  return typeof level === 'string' ? level.trim().toLowerCase() : '';
}

export function getLevelClass(level) {
  return levelClasses[getLevelKey(level)] || 'bg-gray-100 text-gray-700';
}

export function getLevelLabel(level) {
  return levelLabels[getLevelKey(level)] || level || '';
}