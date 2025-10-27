import React, { useRef, useEffect } from "react";
import { useKeyboardNavigation } from "../hooks/useFocusManagement";

export interface Bank {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface BankGridProps {
  banks: Bank[];
  onBankSelect: (bank: Bank) => void;
  selectedBanks?: string[];
}

const BankGrid: React.FC<BankGridProps> = ({
  banks,
  onBankSelect,
  selectedBanks = [],
}) => {
  const itemsRef = useRef<HTMLElement[]>([]);
  const { handleKeyDown, setCurrentIndex } = useKeyboardNavigation(
    { current: itemsRef.current },
    "horizontal",
    1 // Single row horizontal navigation
  );

  useEffect(() => {
    // Set up keyboard navigation
    const container = itemsRef.current[0]?.parentElement;
    if (container) {
      container.addEventListener("keydown", handleKeyDown);
      return () => container.removeEventListener("keydown", handleKeyDown);
    }
  }, [handleKeyDown]);

  return (
    <div className="bank-grid px-3 sm:px-3 py-3" style={{ background: "#fff" }}>
      <div
        className="bank-grid__container overflow-x-auto [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label="Bancos disponibles"
        style={{
          scrollbarWidth: "none" /* Firefox */,
          msOverflowStyle: "none" /* Internet Explorer 10+ */,
        }}
      >
        <div className="flex gap-2 sm:gap-3">
          {banks.map((bank, index) => (
            <button
              key={bank.id}
              ref={(el) => {
                if (el) itemsRef.current[index] = el;
              }}
              className={`bank-grid__item bank-item touch-target touch-button touch-feedback flex items-center justify-center px-3 py-2 rounded-lg transition-all focus-visible:focus-visible micro-bounce flex-shrink-0 ${
                selectedBanks.includes(bank.id)
                  ? "bank-grid__item--active bg-primary-50 border-2 border-primary-500"
                  : "bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }`}
              onClick={() => {
                onBankSelect(bank);
                setCurrentIndex(index);
              }}
              onFocus={() => setCurrentIndex(index)}
              aria-label={`${
                selectedBanks.includes(bank.id)
                  ? "Deseleccionar"
                  : "Seleccionar"
              } banco ${bank.name}`}
              aria-pressed={selectedBanks.includes(bank.id)}
              tabIndex={index === 0 ? 0 : -1} // Roving tabindex
              style={{
                minHeight: "var(--touch-target-comfortable)",
              }}
            >
              <span className="bank-grid__label text-xs sm:text-sm font-medium text-gray-700 text-center whitespace-nowrap">
                {bank.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BankGrid;
