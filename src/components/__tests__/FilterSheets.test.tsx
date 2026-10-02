import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BankFilterSheet from '../neo/BankFilterSheet';
import CategoryFilterSheet from '../neo/CategoryFilterSheet';
import UnifiedFilterSheet, { type UnifiedFilterValues } from '../neo/UnifiedFilterSheet';
import { buildBankOptions } from '../../utils/banks';

const bankOptions = buildBankOptions(['Galicia', 'Santander']);

const emptyValues: UnifiedFilterValues = {
  selectedBanks: [],
  selectedCategory: '',
  minDiscount: undefined,
  availableDay: undefined,
  cardMode: undefined,
  onlineOnly: false,
  hasInstallments: undefined,
  sortByDistance: false,
};

describe('UnifiedFilterSheet', () => {
  it('discards the draft when closed and applies it only from the apply button', () => {
    const onClose = vi.fn();
    const onApply = vi.fn();
    render(
      <UnifiedFilterSheet isOpen onClose={onClose} bankOptions={bankOptions} values={emptyValues} onApply={onApply} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Galicia/i }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar filtros sin aplicar' })[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onApply).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros (1)' }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ selectedBanks: [bankOptions[0].token] }));
  });

  it('closes with Escape without applying', () => {
    const onClose = vi.fn();
    const onApply = vi.fn();
    render(
      <UnifiedFilterSheet isOpen onClose={onClose} bankOptions={bankOptions} values={emptyValues} onApply={onApply} />,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onApply).not.toHaveBeenCalled();
  });
});

describe('BankFilterSheet', () => {
  it('only applies the selection from the apply button', () => {
    const onClose = vi.fn();
    const onApply = vi.fn();
    render(
      <BankFilterSheet isOpen options={bankOptions} selectedTokens={[]} onClose={onClose} onApply={onApply} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Santander/i }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar selector de bancos sin aplicar' })[0]);
    expect(onApply).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar (1 banco)' }));
    expect(onApply).toHaveBeenCalledWith([bankOptions[1].token]);
  });
});

describe('CategoryFilterSheet', () => {
  it('applies a category on tap and clears it when tapping the active one', () => {
    const onApply = vi.fn();
    const { rerender } = render(
      <CategoryFilterSheet isOpen selected="" onClose={vi.fn()} onApply={onApply} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Moda/ }));
    expect(onApply).toHaveBeenLastCalledWith('moda');

    rerender(<CategoryFilterSheet isOpen selected="moda" onClose={vi.fn()} onApply={onApply} />);
    fireEvent.click(screen.getByRole('button', { name: /Moda/ }));
    expect(onApply).toHaveBeenLastCalledWith('');
  });
});
