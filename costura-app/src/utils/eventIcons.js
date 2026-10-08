import { Sparkles, UserRound, Palette, Feather, PartyPopper, BookOpen, Users, Scissors, Heart, CalendarHeart } from 'lucide-react';

// Mapa de íconos disponibles para las tarjetas de eventos. La clave se
// guarda en la DB (campo `icon` del evento) y acá se resuelve a un
// componente lucide; si un evento guarda una clave desconocida, cae en
// Sparkles. Las claves de este mapa son las opciones del formulario admin.
export const EVENT_ICONS = {
  Sparkles,
  UserRound,
  Palette,
  Feather,
  PartyPopper,
  BookOpen,
  Users,
  Scissors,
  Heart,
  CalendarHeart,
};

export const EVENT_ICON_KEYS = Object.keys(EVENT_ICONS);

export function eventIcon(iconKey) {
  return EVENT_ICONS[iconKey] || EVENT_ICONS.Sparkles;
}