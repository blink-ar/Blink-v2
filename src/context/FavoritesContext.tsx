import React, { createContext, useContext, useState, useCallback } from 'react';
import { Business } from '../types';

const STORAGE_KEY = 'blink_favorites';

function loadFavorites(): Business[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Business[]) : [];
  } catch {
    return [];
  }
}

function persistFavorites(favorites: Business[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

interface FavoritesContextValue {
  favorites: Business[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (business: Business) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Business[]>(loadFavorites);

  const isFavorite = useCallback(
    (id: string) => favorites.some((b) => b.id === id),
    [favorites],
  );

  const toggleFavorite = useCallback((business: Business) => {
    setFavorites((prev) => {
      const next = prev.some((b) => b.id === business.id)
        ? prev.filter((b) => b.id !== business.id)
        : [...prev, business];
      persistFavorites(next);
      return next;
    });
  }, []);

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
