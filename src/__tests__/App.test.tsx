import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { RootRedirect } from '../App';

function LocationProbe() {
  const location = useLocation();

  return (
    <div data-testid="location">
      {`${location.pathname}${location.search}${location.hash}`}
    </div>
  );
}

describe('RootRedirect', () => {
  it('preserves query params and hash when redirecting to home', async () => {
    render(
      <MemoryRouter initialEntries={['/?utm_source=reddit&utm_medium=post&utm_campaign=descuentos_argentina#pricing']}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/home" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/home?utm_source=reddit&utm_medium=post&utm_campaign=descuentos_argentina#pricing',
      );
    });
  });
});
