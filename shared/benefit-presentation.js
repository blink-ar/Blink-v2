// A numeric canonical field (including explicit null/0) is authoritative.
// Legacy text parsing is used only when the field is absent during rollout.
export function getPromotionKind(benefit) {
  const text = [benefit?.tipo, benefit?.claseDeBeneficio, benefit?.benefit,
    benefit?.benefitTitle, benefit?.otherDiscounts].filter(Boolean).join(' ')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/sorteo|sorteamos|participa.*gan/.test(text)) return 'sorteo';
  if (/reintegro|cashback/.test(text)) return 'reintegro';
  return 'descuento';
}

export function getBenefitPercentage(benefit) {
  if (!benefit || getPromotionKind(benefit) === 'sorteo') return null;
  if (Object.prototype.hasOwnProperty.call(benefit, 'discountPercentage')) {
    const value = benefit.discountPercentage;
    return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 100 ? value : null;
  }
  const value = String(benefit.rewardRate || benefit.valor || '');
  const match = value.match(/(\d+(?:[.,]\d+)?)\s*%/);
  const percentage = match ? Number(match[1].replace(',', '.')) : 0;
  return percentage > 0 && percentage <= 100 ? percentage : null;
}

export function getBenefitDiscountPercentage(benefit) {
  return getPromotionKind(benefit) === 'descuento' ? getBenefitPercentage(benefit) : null;
}
