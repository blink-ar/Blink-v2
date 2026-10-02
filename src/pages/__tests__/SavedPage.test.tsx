import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SavedPage from '../SavedPage';
import { Business } from '../../types';
import { fetchBusinessById } from '../../services/api';
import { SAVED_BENEFITS_STORAGE_KEY } from '../../utils/savedBenefits';

vi.mock('../../services/api', () => ({
  fetchBusinessById: vi.fn(),
}));

vi.mock('../../context/FavoritesContext', () => ({
  useFavorites: () => ({ favorites: [], isFavorite: () => false, toggleFavorite: vi.fn(), requiresAuth: false }),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, user: null }),
}));

const business = {
  id: 'merchant_1',
  name: 'Coto',
  category: 'supermercados',
  description: '',
  rating: 0,
  location: [],
  image: '',
  benefits: [
    { id: 'b-1', bankName: 'Galicia', cardName: 'Visa', benefit: '20% de descuento', rewardRate: '20%', color: '', icon: '', validUntil: '2999-12-31' },
  ],
} as Business;

let store: Map<string, string>;

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <SavedPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('SavedPage saved benefits', () => {
  beforeEach(() => {
    store = new Map();
    vi.mocked(window.localStorage.getItem).mockImplementation((key) => store.get(key) ?? null);
    vi.mocked(window.localStorage.setItem).mockImplementation((key, value) => { store.set(key, String(value)); });
    vi.mocked(fetchBusinessById).mockResolvedValue(business);
  });

  it('lists benefits saved from the detail page without requiring login', async () => {
    store.set(SAVED_BENEFITS_STORAGE_KEY, JSON.stringify(['merchant_1:b-1']));
    renderPage();

    expect(await screen.findByText('20% de descuento')).toBeInTheDocument();
    expect(screen.getByText('Iniciá sesión para guardar comercios y sincronizarlos entre dispositivos.')).toBeInTheDocument();
  });

  it('lets users clear saved benefits that no longer exist', async () => {
    store.set(SAVED_BENEFITS_STORAGE_KEY, JSON.stringify(['merchant_1:b-1', 'merchant_1:gone']));
    renderPage();

    expect(await screen.findByText('1 beneficio guardado ya no está disponible.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar' }));

    await waitFor(() => {
      expect(JSON.parse(store.get(SAVED_BENEFITS_STORAGE_KEY) ?? '[]')).toEqual(['merchant_1:b-1']);
    });
    expect(screen.queryByText(/ya no está disponible/)).not.toBeInTheDocument();
  });

  it('keeps saved keys when the merchant could not be fetched', async () => {
    store.set(SAVED_BENEFITS_STORAGE_KEY, JSON.stringify(['merchant_1:b-1']));
    vi.mocked(fetchBusinessById).mockRejectedValue(new Error('network'));
    renderPage();

    expect(await screen.findByText(/No pudimos cargar tus beneficios guardados/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Quitar' })).not.toBeInTheDocument();
  });
});
