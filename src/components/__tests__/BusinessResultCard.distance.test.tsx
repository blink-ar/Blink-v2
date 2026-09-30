import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import BusinessResultCard from '../BusinessResultCard';
import { Business } from '../../types';
const base = { id: 'havanna', name: 'Havanna', category: 'gastronomia', description: '', rating: 5, image: '', location: [], benefits: [] } as Business;
describe('mobile/list and desktop card distances', () => {
  it.each(['list', 'desktop-card'] as const)('never displays poisoned distance text in %s', variant => {
    for (const distance of [null, undefined, NaN, Infinity, -1]) {
      const result = render(<MemoryRouter><BusinessResultCard business={{ ...base, distance, distanceText: 'NaNkm' } as Business} variant={variant} /></MemoryRouter>);
      expect(screen.queryByText(/NaN|Infinity|0m|0km/)).not.toBeInTheDocument();
      result.unmount();
    }
  });
  it.each([[0, '0m'], [0.25, '250m'], [1.935, '1.9km']] as const)('shows legitimate distance %s', (distance, label) => {
    render(<MemoryRouter><BusinessResultCard business={{ ...base, distance, distanceText: 'NaNkm' }} /></MemoryRouter>);
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.queryByText('NaNkm')).not.toBeInTheDocument();
  });
});
