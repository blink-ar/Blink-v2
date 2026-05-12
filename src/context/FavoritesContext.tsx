import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Business } from '../types';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_KEY = 'blink_favorites';
const TOKEN_KEY = 'blink_id_token';

function loadCache(): Business[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Business[]) : [];
  } catch {
    return [];
  }
}

function persistCache(favorites: Business[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // ignore quota errors
  }
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface FavoritesContextValue {
  favorites: Business[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (business: Business) => boolean;
  requiresAuth: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [favorites, setFavorites] = useState<Business[]>(loadCache);
  const lastUserId = useRef<string | null>(null);

  // Sync from server when authenticated; clear locally when logged out.
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (lastUserId.current !== null) {
        setFavorites([]);
        persistCache([]);
        lastUserId.current = null;
      }
      return;
    }

    if (lastUserId.current === user.id) return;
    lastUserId.current = user.id;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/favorites', { headers: authHeaders() });
        if (!res.ok) return;
        const data = (await res.json()) as { favoriteMerchantIds?: string[] };
        const serverIds = new Set(data.favoriteMerchantIds ?? []);
        if (cancelled) return;
        setFavorites((prev) => {
          const byId = new Map(prev.map((b) => [b.id, b]));
          const merged = Array.from(serverIds)
            .map((id) => byId.get(id))
            .filter((b): b is Business => Boolean(b));
          // Keep any cached business records that match server IDs; drop the rest.
          persistCache(merged);
          return merged;
        });
      } catch {
        // network failure — keep local cache as-is
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  const isFavorite = useCallback(
    (id: string) => favorites.some((b) => b.id === id),
    [favorites],
  );

  const toggleFavorite = useCallback(
    (business: Business): boolean => {
      if (!isAuthenticated) return false;

      let added = false;
      setFavorites((prev) => {
        const exists = prev.some((b) => b.id === business.id);
        added = !exists;
        const next = exists
          ? prev.filter((b) => b.id !== business.id)
          : [...prev, business];
        persistCache(next);
        return next;
      });

      const url = added
        ? '/api/user/favorites'
        : `/api/user/favorites/${encodeURIComponent(business.id)}`;
      const init: RequestInit = {
        method: added ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: added ? JSON.stringify({ merchantId: business.id }) : undefined,
      };
      fetch(url, init).catch(() => {
        // best-effort sync; local state remains authoritative until next reload
      });

      return true;
    },
    [isAuthenticated],
  );

  return (
    <FavoritesContext.Provider
      value={{ favorites, isFavorite, toggleFavorite, requiresAuth: !isAuthenticated }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
