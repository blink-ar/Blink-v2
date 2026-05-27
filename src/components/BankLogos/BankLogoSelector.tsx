import React from 'react';
import BankLogo from './BankLogo';

interface BankLogoSelectorProps {
  bankName: string;
  size?: number;
  className?: string;
}

export const BankLogoSelector: React.FC<BankLogoSelectorProps> = ({
  bankName,
  size = 24,
  className = '',
}) => <BankLogo bankName={bankName} size={size} className={className} />;
