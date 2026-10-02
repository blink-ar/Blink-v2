import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Ticker from '../neo/Ticker';

describe('Ticker', () => {
  it('does not announce "0 beneficios" while stats load', () => {
    render(<Ticker count={0} />);
    expect(screen.queryByText(/0 beneficios/)).not.toBeInTheDocument();
  });

  it('shows the formatted count once loaded', () => {
    render(<Ticker count={4127} />);
    expect(screen.getByText(/4\.127 beneficios activos/)).toBeInTheDocument();
  });
});
