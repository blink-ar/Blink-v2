import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { HomeRedirect } from '../App';

function LocationProbe() {
  const location = useLocation();

  return (
    <div data-testid="location">
      {`${location.pathname}${location.search}${location.hash}`}
    </div>
  );
}

describe('HomeRedirect', () => {
  it('preserves query params and hash when redirecting home to the canonical root', async () => {
    render(
      <MemoryRouter initialEntries={['/home?utm_source=reddit&utm_medium=post&utm_campaign=descuentos_argentina#pricing']}>
        <Routes>
          <Route path="/home" element={<HomeRedirect />} />
          <Route path="/" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/?utm_source=reddit&utm_medium=post&utm_campaign=descuentos_argentina#pricing',
      );
    });
  });
});
