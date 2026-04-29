// Set EXPO_PUBLIC_API_BASE_URL in your .env file for the deployed backend URL
// e.g. EXPO_PUBLIC_API_BASE_URL=https://blink-v2.vercel.app
export const API_BASE_URL =
  (typeof process !== 'undefined' && (process.env as any).EXPO_PUBLIC_API_BASE_URL) ||
  'https://blink-v2.vercel.app';

export const ITEMS_PER_PAGE = 20;

export const CATEGORY_DATA = [
  { id: 'gastronomia', name: 'Gastronomía', emoji: '🍕', bg: '#EEF2FF', text: '#4338CA' },
  { id: 'moda', name: 'Moda', emoji: '👗', bg: '#FCE7F3', text: '#9D174D' },
  { id: 'entretenimiento', name: 'Entretenimiento', emoji: '🎮', bg: '#EDE9FE', text: '#4C1D95' },
  { id: 'deportes', name: 'Deportes', emoji: '⚽', bg: '#D1FAE5', text: '#065F46' },
  { id: 'regalos', name: 'Regalos', emoji: '🎁', bg: '#FEE2E2', text: '#991B1B' },
  { id: 'viajes', name: 'Viajes', emoji: '✈️', bg: '#DBEAFE', text: '#1E40AF' },
  { id: 'automotores', name: 'Automotores', emoji: '🚗', bg: '#F3F4F6', text: '#374151' },
  { id: 'belleza', name: 'Belleza', emoji: '💄', bg: '#FDF2F8', text: '#831843' },
  { id: 'jugueterias', name: 'Jugueterías', emoji: '🧸', bg: '#EEF2FF', text: '#78350F' },
  { id: 'hogar', name: 'Hogar', emoji: '🏠', bg: '#ECFDF5', text: '#064E3B' },
  { id: 'electro', name: 'Electro', emoji: '💻', bg: '#EEF2FF', text: '#312E81' },
  { id: 'shopping', name: 'Supermercado', emoji: '🛒', bg: '#F0FDF4', text: '#14532D' },
  { id: 'otros', name: 'Otros', emoji: '📦', bg: '#F8FAFC', text: '#475569' },
] as const;

export const CATEGORY_MAP: Record<string, { bg: string; text: string; emoji: string }> = {
  gastronomia: { bg: '#EEF2FF', text: '#6366F1', emoji: '🍕' },
  moda:        { bg: '#EDE9FE', text: '#7C3AED', emoji: '👗' },
  viajes:      { bg: '#DBEAFE', text: '#1E40AF', emoji: '✈️' },
  deportes:    { bg: '#D1FAE5', text: '#065F46', emoji: '⚽' },
  belleza:     { bg: '#FDF2F8', text: '#831843', emoji: '💄' },
  entretenimiento: { bg: '#EDE9FE', text: '#4C1D95', emoji: '🎮' },
  hogar:       { bg: '#ECFDF5', text: '#064E3B', emoji: '🏠' },
  electro:     { bg: '#EEF2FF', text: '#312E81', emoji: '💻' },
  shopping:    { bg: '#F0FDF4', text: '#14532D', emoji: '🛒' },
  automotores: { bg: '#F3F4F6', text: '#374151', emoji: '🚗' },
  regalos:     { bg: '#FEE2E2', text: '#991B1B', emoji: '🎁' },
  jugueterias: { bg: '#EEF2FF', text: '#78350F', emoji: '🧸' },
  otros:       { bg: '#F8FAFC', text: '#475569', emoji: '📦' },
};

export const DISCOUNT_OPTIONS = [
  { value: 10, label: '10%+' },
  { value: 20, label: '20%+' },
  { value: 30, label: '30%+' },
  { value: 50, label: '50%+' },
];

export const DAY_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'monday', label: 'Lun' },
  { value: 'tuesday', label: 'Mar' },
  { value: 'wednesday', label: 'Mié' },
  { value: 'thursday', label: 'Jue' },
  { value: 'friday', label: 'Vie' },
  { value: 'saturday', label: 'Sáb' },
  { value: 'sunday', label: 'Dom' },
];
