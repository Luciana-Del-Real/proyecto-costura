import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  // Backend read/write wiring lands in task 4.4; for now favorites keep their
  // previous per-user sessionStorage behavior so the split changes no behavior.
  const storageKey = user ? `costura_data_${user.id}` : null;

  const [favorites, setFavorites] = useState(() => {
    if (!storageKey) return [];
    try {
      const stored = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
      return Array.isArray(stored.favorites) ? stored.favorites : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!storageKey) return;
    let cancelled = false;
    (async () => {
      let next = [];
      try {
        const stored = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
        next = Array.isArray(stored.favorites) ? stored.favorites : [];
      } catch (e) {
        console.error('Error parsing stored user data:', e);
      }
      if (!cancelled) setFavorites(next);
    })();
    return () => { cancelled = true; };
  }, [storageKey]);

  const saveLocal = (f) => {
    if (!storageKey) return;
    const payload = {
      favorites: Array.isArray(f) ? f : favorites,
    };
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      console.error('Error saving user data:', e);
    }
  };

  const toggleFavorite = (courseId) => {
    const updated = Array.isArray(favorites) && favorites.includes(courseId)
      ? favorites.filter(id => id !== courseId)
      : [...(Array.isArray(favorites) ? favorites : []), courseId];
    setFavorites(updated);
    saveLocal(updated);
  };

  const isFavorite = (courseId) => Array.isArray(favorites) && favorites.includes(courseId);

  return (
    <FavoritesContext.Provider value={{
      favorites,
      toggleFavorite, isFavorite,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export const useFavorites = () => useContext(FavoritesContext);