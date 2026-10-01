import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MapPage from '../MapPage';
import { useBenefitsData } from '../../hooks/useBenefitsData';
import type { Business } from '../../types';

const mapMocks = vi.hoisted(() => ({ setView: vi.fn(), fitBounds: vi.fn(), remove: vi.fn(), divIcon: vi.fn() }));
vi.mock('leaflet', () => {
  const layer = () => ({ on: vi.fn().mockReturnThis(), addTo: vi.fn().mockReturnThis(), remove: mapMocks.remove });
  return { default: {
    map: () => ({ on: vi.fn(), getZoom: () => 15, invalidateSize: vi.fn(), remove: vi.fn(), panTo: vi.fn(), setView: mapMocks.setView, fitBounds: mapMocks.fitBounds }),
    marker: layer, tileLayer: layer, divIcon: mapMocks.divIcon, latLngBounds: vi.fn(points => points),
  } };
});
vi.mock('../../hooks/useBenefitsData', () => ({ useBenefitsData: vi.fn() }));
vi.mock('../../hooks/useEnrichedBusinesses', () => ({ useEnrichedBusinesses: (businesses: Business[]) => businesses }));
vi.mock('../../hooks/useGeolocation', () => ({ useGeolocation: () => ({ position: null }) }));
vi.mock('../../hooks/useResponsive', () => ({ useResponsive: () => ({ isDesktop: true }) }));
vi.mock('../../components/neo/BottomNav', () => ({ default: () => null }));
vi.mock('../../components/neo/FilterPanel', () => ({ default: () => null }));

const merchant = (id: string, name: string, lat: number): Business => ({
  id, name, category: 'gastronomia', description: '', rating: 0, image: '', benefits: [],
  location: [{ lat, lng: -65.2, formattedAddress: name + ' address', source: 'address', provider: 'google', confidence: 1, raw: '', updatedAt: '' }],
});
const businesses = [merchant('porter', 'Porter', -26.82), merchant('other', 'Other merchant', -27.8)];
function Navigation() {
  const navigate = useNavigate();
  return <><button onClick={() => navigate('/map?business=other')}>Other</button><button onClick={() => navigate('/map?business=missing')}>Missing</button><button onClick={() => navigate(-1)}>Back</button><button onClick={() => navigate(1)}>Forward</button><MapPage /></>;
}

describe('merchant map scope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
    vi.mocked(useBenefitsData).mockReturnValue({ businesses, isLoading: false, primarySearchError: null } as ReturnType<typeof useBenefitsData>);
  });
  it('shows only exact merchant rows and recenters when IDs change, including back/forward', async () => {
    render(<MemoryRouter initialEntries={['/map?business=porter']}><Navigation /></MemoryRouter>);
    expect(screen.getAllByText('Porter address')).toHaveLength(2);
    expect(screen.queryByText('Other merchant address')).not.toBeInTheDocument();
    expect(mapMocks.setView).toHaveBeenLastCalledWith([-26.82, -65.2], 16);
    fireEvent.click(screen.getByRole('button', { name: /^Other$/ }));
    await waitFor(() => expect(mapMocks.setView).toHaveBeenLastCalledWith([-27.8, -65.2], 16));
    expect(screen.queryByText('Porter address')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Back$/ }));
    await waitFor(() => expect(mapMocks.setView).toHaveBeenLastCalledWith([-26.82, -65.2], 16));
    fireEvent.click(screen.getByRole('button', { name: /^Forward$/ }));
    await waitFor(() => expect(mapMocks.setView).toHaveBeenLastCalledWith([-27.8, -65.2], 16));
    fireEvent.click(screen.getByRole('button', { name: /^Missing$/ }));
    expect(screen.getAllByText('No encontramos este comercio.')).toHaveLength(2);
    expect(screen.queryByText('Other merchant address')).not.toBeInTheDocument();
    expect(screen.queryByText('Porter address')).not.toBeInTheDocument();
    expect(mapMocks.remove).toHaveBeenCalled();
  });
  it.each([
    { name: 'mixed discounts', current: { rewardRate: '15%' }, expected: 'Hasta 15% OFF', marker: '15% OFF · Current' },
    { name: 'mixed installments', current: { rewardRate: '', installments: 3 }, expected: '3 cuotas s/int.', marker: '3 cuotas · Current' },
    { name: 'mixed benefit counts', current: { rewardRate: '' }, expected: '1 beneficios', marker: 'Current' },
    { name: 'expired only', current: null, expected: 'Sin beneficios vigentes', marker: 'Sin beneficios vigentes' },
  ])('keeps branches but excludes expired promotions from $name labels', ({ current, expected, marker }) => {
    const base = { bankName: 'Expired', cardName: '', benefit: 'Offer', rewardRate: '90%', color: '', icon: '', validUntil: '2020-01-01', installments: 12 };
    const scoped = {
      ...businesses[0],
      benefits: [base, ...(current ? [{ ...base, bankName: 'Current', validUntil: '2099-12-31', installments: null, ...current }] : [])],
    };
    vi.mocked(useBenefitsData).mockReturnValue({ businesses: [scoped], isLoading: false, primarySearchError: null } as ReturnType<typeof useBenefitsData>);
    render(<MemoryRouter initialEntries={['/map?business=porter']}><MapPage /></MemoryRouter>);
    expect(screen.getAllByText('Porter address')).toHaveLength(2);
    expect(screen.getAllByText(expected)).toHaveLength(2);
    expect(mapMocks.setView).toHaveBeenLastCalledWith([-26.82, -65.2], 16);
    const markerHtml = mapMocks.divIcon.mock.calls.map(([options]) => options.html).join(' ');
    expect(markerHtml).toContain(marker);
    expect(markerHtml).not.toContain('90%');
    expect(markerHtml).not.toContain('12 cuotas');
    expect(markerHtml).not.toContain('Expired');
    expect(screen.queryByText(/90%|12 cuotas/)).not.toBeInTheDocument();
    // Rendering labels must not strip history from the business passed to detail navigation.
    expect(scoped.benefits[0]).toEqual(base);
  });

  it('does not substitute unrelated results when the exact lookup fails', () => {
    vi.mocked(useBenefitsData).mockReturnValue({ businesses, isLoading: false, primarySearchError: 'Business search failed' } as ReturnType<typeof useBenefitsData>);
    render(<MemoryRouter initialEntries={['/map?business=missing']}><MapPage /></MemoryRouter>);
    expect(screen.getAllByText('No se pudieron cargar las sucursales de este comercio. Volvé a intentar.')).toHaveLength(2);
    expect(screen.queryByText('Porter address')).not.toBeInTheDocument();
    expect(mapMocks.setView).not.toHaveBeenCalled();
  });
});
