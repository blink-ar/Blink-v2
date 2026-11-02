import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NearbyBusinesses from '../NearbyBusinesses';
import { Business } from '../../types';

const business: Business = { id: 'm', name: 'Comercio', category: 'otros', rating: 0, image: '', description: '', location: [], benefits: [] };

describe('nearby facts', () => {
  it('does not fabricate a percentage, distance or street when facts are missing', () => {
    render(<NearbyBusinesses businesses={[business]} onBusinessClick={vi.fn()} onViewMap={vi.fn()} />);
    expect(screen.getByText('Ver beneficios')).toBeInTheDocument();
    expect(screen.getByText('Distancia no disponible')).toBeInTheDocument();
    expect(screen.getByText('Ubicación no disponible')).toBeInTheDocument();
    expect(screen.queryByText('10% OFF')).not.toBeInTheDocument();
    expect(screen.queryByText(/200m|Santa Fe|Córdoba/)).not.toBeInTheDocument();
  });
});
