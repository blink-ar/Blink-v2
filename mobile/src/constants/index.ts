export const API_BASE_URL = 'http://192.168.100.54:3003';

export const ITEMS_PER_PAGE = 20;

export const CATEGORY_DATA = [
  { id: 'gastronomia', name: 'Comida', icon: '🍽️', color: '#F59E0B' },
  { id: 'moda', name: 'Ropa', icon: '👕', color: '#8B5CF6' },
  { id: 'entretenimiento', name: 'Entretenimiento', icon: '🎭', color: '#EF4444' },
  { id: 'deportes', name: 'Deportes', icon: '⚽', color: '#059669' },
  { id: 'regalos', name: 'Regalos', icon: '🎁', color: '#DC2626' },
  { id: 'viajes', name: 'Viajes', icon: '✈️', color: '#06B6D4' },
  { id: 'automotores', name: 'Automotores', icon: '🚗', color: '#1F2937' },
  { id: 'belleza', name: 'Belleza', icon: '💄', color: '#EC4899' },
  { id: 'jugueterias', name: 'Jugueterías', icon: '🧸', color: '#F97316' },
  { id: 'hogar', name: 'Hogar', icon: '🏠', color: '#7C3AED' },
  { id: 'electro', name: 'Electro', icon: '📱', color: '#0891B2' },
  { id: 'shopping', name: 'Super', icon: '🛒', color: '#10B981' },
  { id: 'otros', name: 'Otros', icon: '📦', color: '#6B7280' },
] as const;

export const BANK_DATA = [
  { id: 'santander', name: 'Santander', icon: '🏦', color: '#EC0000' },
  { id: 'bbva', name: 'BBVA', icon: '🏦', color: '#004481' },
  { id: 'banco-de-chile', name: 'Banco de Chile', icon: '🏦', color: '#003DA5' },
  { id: 'bci', name: 'BCI', icon: '🏦', color: '#FF6B35' },
  { id: 'banco-estado', name: 'Banco Estado', icon: '🏦', color: '#0066CC' },
  { id: 'scotiabank', name: 'Scotiabank', icon: '🏦', color: '#DA020E' },
  { id: 'itau', name: 'Itaú', icon: '🏦', color: '#FF6900' },
  { id: 'falabella', name: 'Falabella', icon: '🏦', color: '#7B68EE' },
  { id: 'ripley', name: 'Ripley', icon: '🏦', color: '#E31837' },
  { id: 'cencosud', name: 'Cencosud', icon: '🏦', color: '#00A651' },
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  gastronomia: '#F59E0B',
  moda: '#8B5CF6',
  entretenimiento: '#EF4444',
  deportes: '#059669',
  regalos: '#DC2626',
  viajes: '#06B6D4',
  automotores: '#1F2937',
  belleza: '#EC4899',
  jugueterias: '#F97316',
  hogar: '#7C3AED',
  electro: '#0891B2',
  shopping: '#10B981',
  otros: '#6B7280',
};

export const CATEGORY_ICONS: Record<string, string> = {
  gastronomia: '🍽️',
  moda: '🛍️',
  viajes: '✈️',
  deportes: '⚽',
  entretenimiento: '🎭',
  otros: '🛒',
};
