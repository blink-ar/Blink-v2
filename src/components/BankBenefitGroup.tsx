import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BankBenefit } from '../types';
import { BankLogoSelector } from './BankLogos';
import ModernBenefitCard from './ModernBenefitCard';

interface BankBenefitGroupProps {
  bankName: string;
  benefits: BankBenefit[];
  businessId?: string;
  defaultExpanded?: boolean;
  onBenefitSelect?: (benefit: BankBenefit) => void;
}

export const BankBenefitGroup: React.FC<BankBenefitGroupProps> = ({
  bankName,
  benefits,
  businessId,
  defaultExpanded = true,
  onBenefitSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={toggleExpand}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
        style={{ minHeight: '48px' }}
        aria-expanded={isExpanded}
        aria-controls={`bank-group-${bankName}`}
      >
        <div className="flex items-center gap-3">
          <BankLogoSelector bankName={bankName} size={28} />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{bankName}</span>
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-gray-100 text-gray-700">
              {benefits.length}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Content */}
      <div
        id={`bank-group-${bankName}`}
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 space-y-3">
          {benefits.map((benefit, index) => (
            <ModernBenefitCard
              key={`${benefit.bankName}-${benefit.cardName}-${index}`}
              benefit={benefit}
              onSelect={() => onBenefitSelect?.(benefit)}
              variant="active"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
