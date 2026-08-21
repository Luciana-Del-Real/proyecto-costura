import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { get, post, del } from '../services/api';
import {
  favoriteIdsFromRecords,
  toggleFavoritesState,
  assertAuthenticated,
} from './contextHelpers';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();

  // Favorites course ids. The backend is the source of truth.
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState(null);

  const refreshFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setFavoritesError(null);
      return;
    }
    setFavoritesLoading(true);
    try {
      const records = await get('/favorites');
      setFavorites(favoriteIdsFromRecords(records));
      setFavoritesError(null);
    } catch (e) {
      console.error('Error cargando favoritos:', e);
      setFavorites([]);
      setFavoritesError(e.message || 'No se pudieron cargar tus favoritos.');
    } finally {
      setFavoritesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return undefined;
      return refreshFavorites();
    });
    return () => { cancelled = true; };
  }, [refreshFavorites]);

  // La backend guarda/borra el favorito y recién después actualizamos el
  // estado local: nunca hay mutación local sin confirmación del backend.
  const toggleFavorite = useCallback(async (courseId) => {
    const authError = assertAuthenticated(user);
    if (authError) {
      setFavoritesError(authError);
      return false;
    }
    const isFav = favorites.includes(courseId);
    try {
      if (isFav) {
        await del(`/favorites/courses/${courseId}`);
      } else {
        await post(`/favorites/courses/${courseId}`, {});
      }
      setFavorites(prev => toggleFavoritesState(prev, courseId));
      setFavoritesError(null);
      return true;
    } catch (e) {
      console.error('Error actualizando favorito:', e);
      setFavoritesError(e.message || 'No se pudo actualizar el favorito.');
      return false;
    }
  }, [user, favorites]);

  const isFavorite = useCallback((courseId) => {
    return Array.isArray(favorites) && favorites.includes(courseId);
  }, [favorites]);

  return (
    <FavoritesContext.Provider value={{
      favorites, favoritesLoading, favoritesError,
      refreshFavorites, toggleFavorite, isFavorite,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export const useFavorites = () => useContext(FavoritesContext);