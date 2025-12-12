import React from 'react';
import { Building } from 'lucide-react';
import BBVALogo from './BBVALogo';
import SantanderLogo from './SantanderLogo';
import GaliciaLogo from './GaliciaLogo';
import NacionLogo from './NacionLogo';

interface BankLogoSelectorProps {
  bankName: string;
  size?: number;
  className?: string;
}

export const BankLogoSelector: React.FC<BankLogoSelectorProps> = ({
  bankName,
  size = 24,
  className = '',
}) => {
  // Normalize bank name for matching
  const normalizedBank = bankName.toLowerCase().trim();

  // Match against known banks
  if (normalizedBank.includes('bbva')) {
    return <BBVALogo size={size} className={className} />;
  }

  if (normalizedBank.includes('santander')) {
    return <SantanderLogo size={size} className={className} />;
  }

  if (normalizedBank.includes('galicia')) {
    return <GaliciaLogo size={size} className={className} />;
  }

  if (normalizedBank.includes('nacion') || normalizedBank.includes('nación')) {
    return <NacionLogo size={size} className={className} />;
  }

  // Fallback to building icon for unknown banks
  return (
    <Building
      className={className}
      style={{ width: size, height: size }}
      aria-label={`Logo de ${bankName}`}
    />
  );
};
