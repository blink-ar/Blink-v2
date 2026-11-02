export function getPromotionKind(benefit: unknown): 'sorteo' | 'reintegro' | 'descuento';
export function getBenefitPercentage(benefit: unknown): number | null;
export function getBenefitDiscountPercentage(benefit: unknown): number | null;
