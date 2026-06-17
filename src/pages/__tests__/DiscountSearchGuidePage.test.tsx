import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuery } from '@tanstack/react-query';
import DiscountSearchGuidePage from '../DiscountSearchGuidePage';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('../../components/neo/BottomNav', () => ({
  default: () => null,
}));

vi.mock('../../services/api', () => ({
  fetchBanks: vi.fn(),
  fetchBusinessesPaginated: vi.fn(),
  fetchMongoStats: vi.fn(),
}));

const availableBanks = [
  'Galicia',
  'Santander',
  'BBVA',
  'Macro',
  'Modo',
  'ICBC',
  'HSBC',
  'AMEX',
  'Naranja X',
  'Nación',
  'Ciudad',
];

describe('DiscountSearchGuidePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useQuery).mockImplementation(({ queryKey }) => {
      const [key] = queryKey as string[];

      if (key === 'discount-search-guide-stats') {
        return {
          data: {
            success: true,
            stats: {
              totalBenefits: 1234,
              onlineBenefits: 98,
              physicalBenefits: 1136,
              topCategories: [
                { category: 'gastronomia', count: 400 },
                { category: 'shopping', count: 300 },
                { category: 'moda', count: 200 },
              ],
              topBanks: [
                { bank: 'Galicia', count: 250 },
                { bank: 'Santander', count: 180 },
              ],
            },
          },
          isLoading: false,
          error: null,
        } as ReturnType<typeof useQuery>;
      }

      if (key === 'discount-search-guide-banks') {
        return {
          data: availableBanks,
          isLoading: false,
          error: null,
        } as ReturnType<typeof useQuery>;
      }

      return {
        data: {
          businesses: [],
        },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useQuery>;
    });
  });

  it('renders proof metrics from existing stats fields and the full issuer list', () => {
    render(
      <MemoryRouter initialEntries={['/buscador-de-descuentos-bancarios']}>
        <DiscountSearchGuidePage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Buscador de descuentos bancarios en Argentina'
    );
    expect(screen.getByText('1.234')).toBeInTheDocument();
    expect(screen.getByText('98 / 1.136')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Online / presencial')).toBeInTheDocument();
    expect(screen.getByText('Emisores disponibles')).toBeInTheDocument();
    expect(screen.getByText('Rubros para explorar')).toBeInTheDocument();
    expect(screen.getByText('Información disponible')).toBeInTheDocument();
    expect(screen.getByText('Únicamente beneficios dentro de su ecosistema.')).toBeInTheDocument();
    expect(screen.getByText('Poco contenido en cada beneficio.')).toBeInTheDocument();
    expect(screen.getByText('Escasez de beneficios.')).toBeInTheDocument();
    expect(screen.getByText('No agrupa por comercio.')).toBeInTheDocument();
    expect(screen.queryByText('Mejor uso')).not.toBeInTheDocument();
  });
});
