import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComingSoonSection from '../ComingSoonSection';
import Ticker from '../neo/Ticker';
import { buildBankOptions } from '../../utils/banks';

describe('ComingSoonSection', () => {
  it('never lists an issuer that is already available as "Pronto"', () => {
    render(<ComingSoonSection availableBanks={buildBankOptions(['Banco Nación', 'Banco Ciudad'])} />);

    expect(screen.queryByText('Banco Nación')).not.toBeInTheDocument();
    expect(screen.queryByText('Banco Ciudad')).not.toBeInTheDocument();
    expect(screen.getByText('Brubank')).toBeInTheDocument();
  });

  it('lists every upcoming issuer when nothing is available yet', () => {
    render(<ComingSoonSection />);
    expect(screen.getByText('Banco Nación')).toBeInTheDocument();
  });
});

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
