import React, { useState, useEffect, useCallback } from 'react';
import { X, CreditCard, CheckCircle2, Tag, MapPin, Info } from 'lucide-react';
import { BankBenefit } from '../types';
import { BankLogoSelector } from './BankLogos';
import { GradientBadge } from './GradientBadge';
import { DaysOfWeek } from './ui/DaysOfWeek';
import {
  formatValue,
  processArrayField,
  processTextField,
  hasValidContent,
  formatUsageType,
} from '../utils/benefitFormatters';

interface ModernBenefitDetailModalProps {
  benefit: BankBenefit;
  isOpen: boolean;
  onClose: () => void;
}

const ModernBenefitDetailModal: React.FC<ModernBenefitDetailModalProps> = ({
  benefit,
  isOpen,
  onClose,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle opening
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    }
  }, [isOpen]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setShouldRender(false);
      onClose();
    }, 250); // Match animation duration
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(() => {
    handleClose();
  }, [handleClose]);

  if (!shouldRender) return null;

  // Extract discount percentage from rewardRate
  const getDiscountPercentage = (rewardRate: string) => {
    const match = rewardRate.match(/(\d+)%/);
    return match ? match[1] : rewardRate;
  };

  const discountPercentage = getDiscountPercentage(benefit.rewardRate);

  // Get installments from benefit
  const installments = benefit.installments;

  // Process all fields
  const processedValue = processTextField(benefit.valor);
  const processedLimit = processTextField(benefit.tope);
  const processedCondition = processTextField(benefit.condicion);
  const processedApplicationText = processTextField(benefit.textoAplicacion);
  const processedRequirements = processArrayField(benefit.requisitos || []);
  const processedUsageTypes = processArrayField(benefit.usos || []);

  const formattedValue = processedValue ? formatValue(processedValue) : null;

  // Helper to extract installments from text
  const extractInstallmentsFromText = (text?: string): number | null => {
    if (!text) return null;
    const match = text.match(/(\d+)\s*cuotas/i);
    return match ? parseInt(match[1], 10) : null;
  };

  // Determine display value for discount section
  let displayValue = formattedValue;

  // Check if we have a valid percentage discount
  const hasValidPercentageDiscount = formattedValue &&
    formattedValue !== '0%' &&
    formattedValue !== '0' &&
    formattedValue !== 'N/A' &&
    (formattedValue.includes('%') || !isNaN(Number(formattedValue)));

  // If discount is 0%, show installments instead
  if (formattedValue === '0%' || formattedValue === '0' || (processedValue && processedValue === '0%')) {
    if (installments && installments > 0) {
      displayValue = `${installments} cuotas`;
    } else {
      // Try to extract from benefit title
      const extracted = extractInstallmentsFromText(benefit.benefit);
      if (extracted && extracted > 0) {
        displayValue = `${extracted} cuotas`;
      }
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-250 ${isClosing ? 'opacity-0' : 'animate-fade-in'
          }`}
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
        <div
          className={`bg-white w-full max-w-2xl max-h-[80vh] rounded-t-3xl shadow-2xl overflow-hidden pointer-events-auto ${isClosing ? 'animate-slide-to-bottom' : 'animate-slide-from-bottom'
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 px-6 py-6">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            {/* Bank and discount info */}
            <div className="flex items-start gap-4 pr-12">
              <div className="bg-white p-3 rounded-2xl shadow-lg">
                <BankLogoSelector bankName={benefit.bankName} size={32} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-white font-bold text-lg">
                    {benefit.bankName}
                  </h2>
                </div>
                <p className="text-white/90 text-sm font-medium">
                  {benefit.cardName}
                </p>
              </div>

              <div className="flex-shrink-0">
                <GradientBadge
                  percentage={discountPercentage}
                  installments={installments}
                  otherDiscounts={benefit.otherDiscounts}
                  variant="featured"
                  size="lg"
                />
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto max-h-[calc(80vh-120px)] px-6 py-6">
            <div className="space-y-6">
              {/* Benefit description */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Beneficio
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {benefit.benefit}
                </p>
                {benefit?.description && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                )}
              </section>

              {/* Days of week availability */}
              <DaysOfWeek benefit={benefit} />

              {/* Discount and Limits */}
              {(displayValue || processedLimit) && (
                <section className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <Tag className="h-4 w-4 text-primary-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Beneficio
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {displayValue && (
                      <div className="flex items-center justify-between">
                        {/* <span className="text-sm text-gray-600">Valor</span> */}
                        <span className="text-lg font-bold text-primary-600">
                          {displayValue}
                        </span>
                      </div>
                    )}
                    {processedLimit ? (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="text-sm text-gray-600">Tope de reintegro</span>
                        <span className="text-base font-semibold text-gray-900">
                          ${processedLimit}
                        </span>
                      </div>
                    ) : hasValidPercentageDiscount ? (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="text-sm text-gray-600">Tope de reintegro</span>
                        <span className="text-base font-semibold text-gray-900">
                          Sin tope de reintegro.
                        </span>
                      </div>
                    ) : null}
                  </div>
                </section>
              )}

              {/* Usage types - Where can you use it */}
              {processedUsageTypes.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <h3 className="text-base font-semibold text-gray-900">
                      ¿Dónde usar?
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {processedUsageTypes.map((usage, index) => {
                      const formattedUsage = formatUsageType(usage);
                      return (
                        <span
                          key={index}
                          className="inline-flex items-center px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-primary-300 transition-colors"
                        >
                          {formattedUsage}
                        </span>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Requirements */}
              {processedRequirements.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-gray-500" />
                    <h3 className="text-base font-semibold text-gray-900">
                      Requisitos
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {processedRequirements.map((requirement, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-primary-600 text-xs font-bold">
                            {index + 1}
                          </span>
                        </div>
                        <span className="text-gray-700 text-sm leading-relaxed flex-1">
                          {processTextField(requirement)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* How to Apply */}
              {hasValidContent(processedApplicationText) && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="h-5 w-5 text-gray-500" />
                    <h3 className="text-base font-semibold text-gray-900">
                      Cómo aplicar
                    </h3>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                      {processedApplicationText}
                    </p>
                  </div>
                </section>
              )}

              {/* Conditions */}
              {hasValidContent(processedCondition) && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="h-5 w-5 text-gray-500" />
                    <h3 className="text-base font-semibold text-gray-900">
                      Condiciones
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {processedCondition}
                  </p>
                </section>
              )}

              {/* Info Section - For development/debug or extra info */}
              {(benefit.id || benefit.validUntil) && (
                <section className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span>📊</span>
                    <span>Información adicional</span>
                  </h4>
                  <div className="space-y-2 text-xs text-gray-600">
                    {benefit.id && (
                      <div className="flex justify-between">
                        <span className="font-medium">ID:</span>
                        <span className="text-gray-500 font-mono">{benefit.id}</span>
                      </div>
                    )}
                    {benefit.validUntil && (
                      <div className="flex justify-between">
                        <span className="font-medium">Válido hasta:</span>
                        <span>{benefit.validUntil}</span>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModernBenefitDetailModal;
