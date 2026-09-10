// Mapeo de niveles: el backend guarda el enum en MAYÚSCULAS
// (PRINCIPIANTE|INTERMEDIO|AVANZADO), así que las claves se normalizan a
// minúsculas para que cada nivel válido muestre siempre su color correcto
// (nunca el gris por defecto). Niveles desconocidos caen en el fallback neutro.
// Escala rosa/fucsia de la identidad Grow: principiante suave → avanzado intenso.
import i18n from '../i18n';

const levelClasses = {
  principiante: 'bg-primary-soft text-primary', // Rosa pastel muy sutil
  intermedio: 'bg-secondary/40 text-primary-hover', // Rosa medio
  avanzado: 'bg-accent text-white', // Fucsia intenso (sólido)
};

// Level keys resolve through i18n so the badge follows the active language.
// Components that render a level label also call useTranslation, so they
// re-render on language change and this lookup picks up the new language.
const levelLabelKeys = {
  principiante: 'levels.beginner',
  intermedio: 'levels.intermediate',
  avanzado: 'levels.advanced',
};

export function getLevelKey(level) {
  return typeof level === 'string' ? level.trim().toLowerCase() : '';
}

export function getLevelClass(level) {
  return levelClasses[getLevelKey(level)] || 'bg-gray-100 text-gray-700';
}

export function getLevelLabel(level) {
  const key = levelLabelKeys[getLevelKey(level)];
  return key ? i18n.t(key) : level || '';
}